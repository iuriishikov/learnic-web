'use client';

import {
  CheckIcon,
  GiftIcon,
  Loader2Icon,
  SearchIcon,
  UserSearchIcon,
  UsersIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';

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
import { TextInput } from '@/shared/ui/input-extended';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserAvatar } from '@/shared/ui/user-avatar';

import { useUserSearch } from '../../api/use-team';
import { useGiftByEmailMutation, useGiftByUserMutation } from '../../api/use-gifts';
import type { Gift } from '../../model/gifts';
import type { UserSearchResult } from '../../model/team';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_QUERY_LEN = 2;

export type GiftInviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  /** Owner is filtered out of results — they already own the product. */
  ownerId: string;
  /** Existing gifts for this product — used to mark already-gifted recipients. */
  gifts: ReadonlyArray<Gift>;
};

export function GiftInviteDialog({
  open,
  onOpenChange,
  productId,
  ownerId,
  gifts,
}: GiftInviteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[480px]">
        {open ? (
          <GiftSearchPanel
            productId={productId}
            ownerId={ownerId}
            gifts={gifts}
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

function GiftSearchPanel({
  productId,
  ownerId,
  gifts,
  onClose,
}: {
  productId: string;
  ownerId: string;
  gifts: ReadonlyArray<Gift>;
  onClose: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.giftDialog');
  const tToast = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 250);
  const [justGiftedIds, setJustGiftedIds] = useState<ReadonlyArray<string>>([]);
  const [justGiftedEmails, setJustGiftedEmails] = useState<
    ReadonlyArray<string>
  >([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const giftByUser = useGiftByUserMutation(productId);
  const giftByEmail = useGiftByEmailMutation(productId);

  const isEmailQuery = EMAIL_PATTERN.test(debouncedQuery);
  const search = useUserSearch(debouncedQuery, {
    enabled: !isEmailQuery && debouncedQuery.length >= MIN_QUERY_LEN,
  });

  // Recipients with a live gift (pending or accepted) can't be gifted
  // again. Terminal statuses (declined, revoked) are skipped so the
  // owner can re-gift a note someone turned down.
  const existingUserIds = useMemo(() => {
    const set = new Set<string>([ownerId]);
    for (const g of gifts) {
      if (g.status === 'declined' || g.status === 'revoked') continue;
      if (g.recipient?.id) set.add(g.recipient.id);
    }
    return set;
  }, [gifts, ownerId]);

  const existingEmails = useMemo(() => {
    const set = new Set<string>();
    for (const g of gifts) {
      if (g.status === 'declined' || g.status === 'revoked') continue;
      const email = (g.recipient?.email ?? g.invitedEmail ?? '')
        .trim()
        .toLowerCase();
      if (email) set.add(email);
    }
    return set;
  }, [gifts]);

  function rebootForNextSearch() {
    setQuery('');
    inputRef.current?.focus();
  }

  function handleGiftByUser(user: UserSearchResult) {
    giftByUser.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          setJustGiftedIds((prev) => [...prev, user.id]);
          notify.success(
            tToast('giftSentTo', { name: user.fullName.trim() || user.id }),
          );
        },
      },
    );
  }

  function handleGiftByEmail(email: string) {
    giftByEmail.mutate(
      { email },
      {
        onSuccess: () => {
          setJustGiftedEmails((prev) => [...prev, email.toLowerCase()]);
          notify.success(tToast('giftSentTo', { name: email }));
          rebootForNextSearch();
        },
      },
    );
  }

  const showInitial = debouncedQuery.length === 0;
  const showShort = !showInitial && debouncedQuery.length < MIN_QUERY_LEN;
  const showEmail = !showShort && isEmailQuery;

  return (
    <div className="flex flex-col">
      <DialogHeader className="px-6 pt-6 pb-4 text-left">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/15">
            <GiftIcon className="size-[18px] text-brand" aria-hidden />
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
        <TextInput
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchAriaLabel')}
          autoFocus
          inputMode="search"
          autoComplete="off"
          leadingIcon={<SearchIcon />}
          trailingIcon={
            search.isFetching && !showInitial && !showShort && !isEmailQuery ? (
              <Loader2Icon
                aria-hidden
                className="size-4 animate-spin text-muted-foreground"
              />
            ) : undefined
          }
          className={cn(
            'h-11 bg-background text-sm',
            'transition-shadow focus-visible:shadow-sm',
          )}
        />
      </div>

      <div className="border-t border-border" />

      <div
        role="region"
        aria-live="polite"
        className="min-h-[260px] px-3 pt-3 pb-4"
      >
        <AnimatePresence mode="wait" initial={false}>
          {showInitial ? (
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
                description={t('emptyShort.description', { min: MIN_QUERY_LEN })}
              />
            </FadeBlock>
          ) : showEmail ? (
            <FadeBlock key="email" reduceMotion={!!reduceMotion}>
              <EmailGiftPanel
                email={debouncedQuery}
                pending={giftByEmail.isPending}
                alreadyGifted={
                  existingEmails.has(debouncedQuery.toLowerCase()) ||
                  justGiftedEmails.includes(debouncedQuery.toLowerCase())
                }
                onGift={() => handleGiftByEmail(debouncedQuery)}
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
                justGiftedIds={justGiftedIds}
                giftInProgressId={
                  giftByUser.isPending
                    ? giftByUser.variables?.userId ?? null
                    : null
                }
                onGift={handleGiftByUser}
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
  justGiftedIds,
  giftInProgressId,
  onGift,
  onRetry,
}: {
  query: string;
  isPending: boolean;
  isError: boolean;
  results: ReadonlyArray<UserSearchResult>;
  existingUserIds: Set<string>;
  justGiftedIds: ReadonlyArray<string>;
  giftInProgressId: string | null;
  onGift: (user: UserSearchResult) => void;
  onRetry: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.giftDialog');

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
          const justAdded = justGiftedIds.includes(user.id);
          const inFlight = giftInProgressId === user.id;
          return (
            <li key={user.id}>
              <UserRow
                user={user}
                already={already}
                justAdded={justAdded}
                inFlight={inFlight}
                onGift={() => onGift(user)}
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
  onGift,
}: {
  user: UserSearchResult;
  already: boolean;
  justAdded: boolean;
  inFlight: boolean;
  onGift: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.giftDialog');
  const name = user.fullName.trim() || user.id;
  const disabled = already || justAdded || inFlight;
  const avatarUser = {
    id: user.id,
    fullName: user.fullName,
    avatar: user.avatar,
    isVerified: user.isVerified,
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
            {justAdded ? t('justGifted') : t('alreadyGifted')}
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
          {t('giftedBadge')}
        </span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onGift}
          disabled={disabled}
          className="h-7 gap-1 px-2.5 text-xs"
        >
          {inFlight ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <GiftIcon className="size-3.5" aria-hidden />
          )}
          {t('gift')}
        </Button>
      )}
    </div>
  );
}

function EmailGiftPanel({
  email,
  pending,
  alreadyGifted,
  onGift,
}: {
  email: string;
  pending: boolean;
  alreadyGifted: boolean;
  onGift: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.giftDialog');
  return (
    <div className="flex flex-col gap-3 px-3 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand ring-1 ring-brand/20">
          <GiftIcon className="size-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">
          {alreadyGifted ? t('emailMode.alreadyTitle') : t('emailMode.title')}
        </p>
        <p className="max-w-[320px] text-xs leading-relaxed text-muted-foreground">
          {alreadyGifted
            ? t('emailMode.alreadyDescription')
            : t('emailMode.description')}
        </p>
        <span className="rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-1 font-mono text-[13px] tracking-tight text-foreground">
          {email}
        </span>
      </div>
      {!alreadyGifted ? (
        <Button
          type="button"
          onClick={onGift}
          disabled={pending}
          className="h-10 gap-2 self-center bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
          ) : (
            <GiftIcon className="size-4" aria-hidden />
          )}
          {pending ? t('emailMode.sending') : t('emailMode.cta')}
        </Button>
      ) : null}
    </div>
  );
}
