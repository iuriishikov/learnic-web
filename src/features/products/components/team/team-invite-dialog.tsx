'use client';

import {
  CheckIcon,
  Loader2Icon,
  MailPlusIcon,
  SearchIcon,
  UserPlus2Icon,
  UserSearchIcon,
  UsersIcon,
} from 'lucide-react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react';
import { useTranslations } from 'next-intl';
import { memo, useMemo, useRef, useState } from 'react';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserAvatar } from '@/shared/ui/user-avatar';

import {
  useInviteByEmailMutation,
  useInviteByUserMutation,
  useMyEffectivePermissions,
  useProductCollaborations,
  useUserSearch,
} from '../../api/use-team';
import type { GrantSpec, Role, UserSearchResult } from '../../model/team';

import {
  assignableRoles,
  colorForRole,
  roleColorClasses,
} from './team-shared';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_QUERY_LEN = 2;

export type TeamInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  /** Owner is filtered out of results — they can't be invited to their own product. */
  ownerId: string;
  roles: ReadonlyArray<Role>;
  defaultRoleId?: string | null;
};

export function TeamInviteDialog({
  open,
  onOpenChange,
  productId,
  ownerId,
  roles,
  defaultRoleId,
}: TeamInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[480px]">
        {open ? (
          <InviteSearchPanel
            key={defaultRoleId ?? 'invite'}
            productId={productId}
            ownerId={ownerId}
            roles={roles}
            defaultRoleId={defaultRoleId ?? null}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

function InviteSearchPanel({
  productId,
  ownerId,
  roles,
  defaultRoleId,
  onClose,
}: {
  productId: string;
  ownerId: string;
  roles: ReadonlyArray<Role>;
  defaultRoleId: string | null;
  onClose: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.inviteDialog');
  const tToast = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  const reduceMotion = useReducedMotion();

  const myPerms = useMyEffectivePermissions(productId);
  const myPosition = myPerms.data?.hierarchyPosition ?? null;

  // Filter to roles strictly below the actor (owner sees all).
  const allowedRoles = useMemo(
    () => assignableRoles(roles, myPosition),
    [roles, myPosition],
  );

  // Default-pick the lowest-rank role (largest position) so the
  // initial selection cannot accidentally outrank existing members.
  const fallbackRole = allowedRoles.length
    ? [...allowedRoles].sort((a, b) => b.position - a.position)[0]
    : undefined;
  const initialRoleId =
    defaultRoleId && allowedRoles.some((r) => r.id === defaultRoleId)
      ? defaultRoleId
      : fallbackRole?.id ?? '';
  const [roleId, setRoleId] = useState(initialRoleId);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const [justInvitedIds, setJustInvitedIds] = useState<ReadonlyArray<string>>(
    [],
  );
  const [justInvitedEmails, setJustInvitedEmails] = useState<
    ReadonlyArray<string>
  >([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const inviteByUser = useInviteByUserMutation(productId);
  const inviteByEmail = useInviteByEmailMutation(productId);
  const collabsQuery = useProductCollaborations(productId);

  const isEmailQuery = EMAIL_PATTERN.test(debouncedQuery);
  const search = useUserSearch(debouncedQuery, {
    enabled: !isEmailQuery && debouncedQuery.length >= MIN_QUERY_LEN,
  });

  // Existing-member lookups: skip the search hit if the person is
  // already an active member or has a pending invite, plus the owner.
  const existingUserIds = useMemo(() => {
    const set = new Set<string>([ownerId]);
    for (const c of collabsQuery.data ?? []) {
      if (c.status === 'revoked') continue;
      if (c.collaborator?.id) set.add(c.collaborator.id);
    }
    return set;
  }, [collabsQuery.data, ownerId]);

  const existingEmails = useMemo(() => {
    const set = new Set<string>();
    for (const c of collabsQuery.data ?? []) {
      if (c.status === 'revoked') continue;
      const email = (c.collaborator?.email ?? c.invitedEmail ?? '')
        .trim()
        .toLowerCase();
      if (email) set.add(email);
    }
    return set;
  }, [collabsQuery.data]);

  function rebootForNextSearch() {
    setQuery('');
    inputRef.current?.focus();
  }

  function handleInviteByUser(user: UserSearchResult) {
    if (!roleId) return;
    const grants: GrantSpec[] = [
      { roleId, scopeType: 'product', scopeId: null },
    ];
    inviteByUser.mutate(
      { userId: user.id, grants },
      {
        onSuccess: () => {
          setJustInvitedIds((prev) => [...prev, user.id]);
          notify.success(
            tToast('inviteSentTo', {
              name: user.fullName.trim() || user.id,
            }),
          );
        },
      },
    );
  }

  function handleInviteByEmail(email: string) {
    if (!roleId) return;
    const grants: GrantSpec[] = [
      { roleId, scopeType: 'product', scopeId: null },
    ];
    inviteByEmail.mutate(
      { email, grants },
      {
        onSuccess: () => {
          setJustInvitedEmails((prev) => [...prev, email.toLowerCase()]);
          notify.success(tToast('inviteSentTo', { name: email }));
          rebootForNextSearch();
        },
      },
    );
  }

  const noRolesAvailable = allowedRoles.length === 0;
  const showNoRoles = noRolesAvailable;
  const showInitial = !showNoRoles && debouncedQuery.length === 0;
  const showShort =
    !showNoRoles && !showInitial && debouncedQuery.length < MIN_QUERY_LEN;
  const showEmail = !showNoRoles && !showShort && isEmailQuery;
  const showSearch = !showNoRoles && !showShort && !isEmailQuery;

  return (
    <div className="flex flex-col">
      <DialogHeader className="px-6 pt-6 pb-4 text-left">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/15">
            <UserPlus2Icon className="size-[18px] text-brand" aria-hidden />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <DialogTitle className="text-[15px] font-semibold tracking-tight">
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-muted-foreground">
              {t('description')}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-4 px-6 pt-1 pb-4">
        {/* Search */}
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAriaLabel')}
            autoFocus
            inputMode="search"
            autoComplete="off"
            className={cn(
              'h-11 bg-background pl-9 text-sm',
              'shadow-xs transition-shadow focus-visible:shadow-sm',
            )}
          />
          {search.isFetching && showSearch ? (
            <Loader2Icon
              aria-hidden
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            />
          ) : null}
        </div>

        {/* Role chips */}
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-medium text-foreground">
              {t('roleLabel')}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {t('roleHint')}
            </span>
          </div>
          {allowedRoles.length === 0 ? (
            <p className="text-xs leading-snug text-muted-foreground">
              {t('roleEmpty')}
            </p>
          ) : (
            <RoleChips
              roles={allowedRoles}
              value={roleId}
              onChange={setRoleId}
            />
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Body */}
      <div
        role="region"
        aria-live="polite"
        className="min-h-[260px] px-3 pt-3 pb-4"
      >
        <AnimatePresence mode="wait" initial={false}>
          {showNoRoles ? (
            <FadeBlock key="no-roles" reduceMotion={!!reduceMotion}>
              <EmptyState
                icon={<UserSearchIcon className="size-5" />}
                title={t('noAssignableRoles.title')}
                description={t('noAssignableRoles.description')}
              />
            </FadeBlock>
          ) : showInitial ? (
            <FadeBlock key="initial" reduceMotion={!!reduceMotion}>
              <EmptyState
                icon={<UserSearchIcon className="size-5" />}
                title={t('emptyInitial.title')}
                description={t('emptyInitial.description')}
              />
            </FadeBlock>
          ) : showShort ? (
            <FadeBlock key="short" reduceMotion={!!reduceMotion}>
              <EmptyState
                icon={<SearchIcon className="size-5" />}
                title={t('emptyShort.title')}
                description={t('emptyShort.description', {
                  min: MIN_QUERY_LEN,
                })}
              />
            </FadeBlock>
          ) : showEmail ? (
            <FadeBlock key="email" reduceMotion={!!reduceMotion}>
              <EmailInvitePanel
                email={debouncedQuery}
                pending={inviteByEmail.isPending}
                alreadyInvited={
                  existingEmails.has(debouncedQuery.toLowerCase()) ||
                  justInvitedEmails.includes(debouncedQuery.toLowerCase())
                }
                onInvite={() => handleInviteByEmail(debouncedQuery)}
              />
            </FadeBlock>
          ) : (
            <FadeBlock key="search" reduceMotion={!!reduceMotion}>
              <SearchResults
                query={debouncedQuery}
                isPending={search.isPending}
                isError={search.isError}
                results={search.data ?? []}
                existingUserIds={existingUserIds}
                justInvitedIds={justInvitedIds}
                inviteInProgressId={
                  inviteByUser.isPending
                    ? inviteByUser.variables?.userId ?? null
                    : null
                }
                onInvite={handleInviteByUser}
                onRetry={() => search.refetch()}
              />
            </FadeBlock>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="h-9 px-4 text-sm"
        >
          {t('done')}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

const RoleChips = memo(function RoleChips({
  roles,
  value,
  onChange,
}: {
  roles: ReadonlyArray<Role>;
  value: string;
  onChange: (id: string) => void;
}) {
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion
    ? { duration: 0 }
    : ({ type: 'spring', stiffness: 420, damping: 32, mass: 0.6 } as const);

  return (
    <LayoutGroup id="invite-role-chips">
      <div
        role="radiogroup"
        aria-label={tRoles('rolePickerAria')}
        className="flex flex-wrap gap-1.5"
      >
        {roles.map((role) => {
          const tone = roleColorClasses(colorForRole(role));
          const checked = role.id === value;
          return (
            <motion.button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onChange(role.id)}
              layout
              transition={transition}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
                checked
                  ? cn(
                      'text-foreground shadow-xs ring-1',
                      tone.bgSoft,
                      tone.ring,
                    )
                  : cn(
                      'border border-border bg-background text-muted-foreground',
                      'hover:border-foreground/20 hover:bg-background hover:text-foreground',
                    ),
              )}
            >
              <motion.span
                aria-hidden
                layout="position"
                className={cn('size-1.5 shrink-0 rounded-full', tone.dot)}
              />
              <motion.span layout="position" className="truncate">
                {role.name}
              </motion.span>
              <AnimatePresence initial={false}>
                {checked ? (
                  <motion.span
                    key="check"
                    layout="position"
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { width: 0, opacity: 0 }
                    }
                    animate={
                      reduceMotion
                        ? { opacity: 1 }
                        : { width: 'auto', opacity: 1 }
                    }
                    exit={
                      reduceMotion
                        ? { opacity: 0 }
                        : { width: 0, opacity: 0 }
                    }
                    transition={transition}
                    className="inline-flex shrink-0 items-center overflow-hidden"
                  >
                    <CheckIcon
                      className={cn('size-3', tone.text)}
                      aria-hidden
                    />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
});

function FadeBlock({
  children,
  reduceMotion,
}: {
  children: React.ReactNode;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      className="px-3"
    >
      {children}
    </motion.div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <div
        className={cn(
          'relative flex size-14 items-center justify-center rounded-2xl',
          'bg-background text-muted-foreground ring-1 ring-border',
          'shadow-xs',
        )}
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-brand/5 to-transparent"
        />
        <span aria-hidden className="text-foreground/70">
          {icon}
        </span>
      </div>
      <p className="text-[14px] font-semibold tracking-tight text-foreground">
        {title}
      </p>
      <p className="max-w-[300px] text-[12.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function SearchResults({
  query,
  isPending,
  isError,
  results,
  existingUserIds,
  justInvitedIds,
  inviteInProgressId,
  onInvite,
  onRetry,
}: {
  query: string;
  isPending: boolean;
  isError: boolean;
  results: ReadonlyArray<UserSearchResult>;
  existingUserIds: Set<string>;
  justInvitedIds: ReadonlyArray<string>;
  inviteInProgressId: string | null;
  onInvite: (user: UserSearchResult) => void;
  onRetry: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.inviteDialog');

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-2 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <SearchIcon className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t('searchError.title')}
        </p>
        <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
          {t('searchError.description')}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 h-8"
        >
          {t('searchError.retry')}
        </Button>
      </div>
    );
  }

  if (isPending) {
    return (
      <ul className="flex flex-col gap-1 py-1" aria-label={t('loadingAria')}>
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-7 w-16 rounded-md" />
          </li>
        ))}
      </ul>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-2 py-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
          <UsersIcon className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {t('noResults.title')}
        </p>
        <p className="max-w-[280px] text-xs leading-relaxed text-muted-foreground">
          {t('noResults.description', { query })}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center justify-between px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>{t('resultsLabel', { count: results.length })}</span>
      </div>
      <ul className="flex flex-col">
        {results.map((user) => {
          const already = existingUserIds.has(user.id);
          const justAdded = justInvitedIds.includes(user.id);
          const inFlight = inviteInProgressId === user.id;
          return (
            <li key={user.id}>
              <UserRow
                user={user}
                already={already}
                justAdded={justAdded}
                inFlight={inFlight}
                onInvite={() => onInvite(user)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UserRow({
  user,
  already,
  justAdded,
  inFlight,
  onInvite,
}: {
  user: UserSearchResult;
  already: boolean;
  justAdded: boolean;
  inFlight: boolean;
  onInvite: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.inviteDialog');
  const name = user.fullName.trim() || user.id;
  const disabled = already || justAdded || inFlight;
  const avatarUser = {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  };

  return (
    <div
      className={cn(
        'group/row flex items-center gap-3 rounded-xl px-3 py-2 transition-colors',
        !disabled && 'hover:bg-muted/50',
      )}
    >
      <UserAvatar user={avatarUser} size="default" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {name}
        </span>
        {already || justAdded ? (
          <span className="truncate text-xs text-emerald-700 dark:text-emerald-400">
            {justAdded ? t('justAdded') : t('alreadyMember')}
          </span>
        ) : (
          <span className="truncate text-xs text-muted-foreground">
            {t('userSubtitle')}
          </span>
        )}
      </div>
      {already || justAdded ? (
        <span
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-400',
          )}
        >
          <CheckIcon className="size-3.5" aria-hidden />
          {t('addedBadge')}
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onInvite}
          disabled={disabled}
          className="h-7 gap-1 px-2.5 text-xs"
        >
          {inFlight ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <UserPlus2Icon className="size-3.5" aria-hidden />
          )}
          {t('add')}
        </Button>
      )}
    </div>
  );
}

function EmailInvitePanel({
  email,
  pending,
  alreadyInvited,
  onInvite,
}: {
  email: string;
  pending: boolean;
  alreadyInvited: boolean;
  onInvite: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.inviteDialog');
  return (
    <div className="flex flex-col gap-3 px-3 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20">
          <MailPlusIcon className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {alreadyInvited
            ? t('emailMode.alreadyTitle')
            : t('emailMode.title')}
        </p>
        <p className="max-w-[320px] text-xs leading-relaxed text-muted-foreground">
          {alreadyInvited
            ? t('emailMode.alreadyDescription')
            : t('emailMode.description')}
        </p>
        <span className="rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-1 font-mono text-[13px] tracking-tight text-foreground">
          {email}
        </span>
      </div>
      {!alreadyInvited ? (
        <Button
          type="button"
          onClick={onInvite}
          disabled={pending}
          className="h-10 gap-2 self-center bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          ) : (
            <MailPlusIcon className="size-4" aria-hidden />
          )}
          {pending ? t('emailMode.sending') : t('emailMode.cta')}
        </Button>
      ) : null}
    </div>
  );
}
