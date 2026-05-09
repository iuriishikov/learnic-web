'use client';

import {
  MailIcon,
  MoreHorizontalIcon,
  RotateCwIcon,
  TimerIcon,
  Trash2Icon,
  UserPlusIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';

import { useProductPermissions } from '../../api/use-product-permissions';
import {
  useProductCollaborations,
  useProductRoles,
  useRevokeCollaborationMutation,
} from '../../api/use-team';
import type { Collaboration } from '../../model/team';

import {
  colorForRole,
  daysUntil,
  primaryGrant,
  roleColorClasses,
} from './team-shared';

export function TeamInvitationsTab({
  productId,
  onAddInvite,
}: {
  productId: string;
  onAddInvite: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.invitations');
  const tLoad = useTranslations('teach-products.editor.team.load');
  const tEditor = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();

  const collabsQuery = useProductCollaborations(productId);
  const rolesQuery = useProductRoles(productId);
  const revoke = useRevokeCollaborationMutation(productId);
  const perms = useProductPermissions(productId);
  const canManageCollaborators = perms.canManageCollaborators;
  const insufficientTitle = tEditor('insufficientPermissions');

  const invitations = useMemo<Collaboration[]>(() => {
    if (!collabsQuery.data) return [];
    return collabsQuery.data.filter((c) => c.status === 'pending_invite');
  }, [collabsQuery.data]);

  const isLoading = collabsQuery.isPending;
  const hasError = collabsQuery.isError;

  return (
    <motion.div
      key="invitations-tab"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {t('title')}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={onAddInvite}
          disabled={!canManageCollaborators}
          title={!canManageCollaborators ? insufficientTitle : undefined}
          className="h-9 shrink-0 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:px-4"
        >
          <UserPlusIcon className="size-4" />
          {t('addCta')}
        </Button>
      </div>

      {hasError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-6"
        >
          <h4 className="font-heading text-base font-semibold tracking-tight text-foreground">
            {tLoad('errorTitle')}
          </h4>
          <p className="text-sm leading-snug text-muted-foreground">
            {tLoad('invitationsErrorDescription')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => collabsQuery.refetch()}
            disabled={collabsQuery.isFetching}
            className="h-8 w-fit gap-1.5"
          >
            <RotateCwIcon
              className={cn(
                'size-3.5',
                collabsQuery.isFetching && 'animate-spin',
              )}
            />
            {tLoad('retry')}
          </Button>
        </div>
      ) : isLoading ? (
        <InvitationsSkeleton />
      ) : invitations.length === 0 ? (
        <EmptyInvitations />
      ) : (
        <ul className="flex flex-col gap-2">
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              <InvitationCard
                invitation={invitation}
                roles={rolesQuery.data ?? []}
                canManageCollaborators={canManageCollaborators}
                insufficientTitle={insufficientTitle}
                onRevoke={() =>
                  revoke.mutate({ collaborationId: invitation.id })
                }
                pendingRevoke={
                  revoke.isPending &&
                  revoke.variables?.collaborationId === invitation.id
                }
              />
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function InvitationCard({
  invitation,
  roles,
  canManageCollaborators,
  insufficientTitle,
  onRevoke,
  pendingRevoke,
}: {
  invitation: Collaboration;
  roles: ReadonlyArray<{ id: string; name: string }>;
  canManageCollaborators: boolean;
  insufficientTitle: string;
  onRevoke: () => void;
  pendingRevoke: boolean;
}) {
  const t = useTranslations('teach-products.editor.team.invitations');
  const tActions = useTranslations(
    'teach-products.editor.team.invitations.actions',
  );
  const formatter = useFormatter();

  const grant = primaryGrant(invitation.grants);
  const role = grant ? roles.find((r) => r.id === grant.roleId) : undefined;
  const roleName = role?.name ?? grant?.roleName ?? '';
  const tone = role
    ? roleColorClasses(colorForRole(role))
    : roleColorClasses('brand');

  const expiresInDays = daysUntil(invitation.inviteExpiresAt);
  const expiringSoon = expiresInDays !== null && expiresInDays <= 1;
  const email = invitation.invitedEmail ?? invitation.collaborator?.email ?? '';

  return (
    <article
      className={cn(
        'group/inv flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-foreground/15 sm:flex-row sm:items-center sm:gap-5',
        pendingRevoke && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-foreground/10',
            tone.bgSoft,
          )}
        >
          <MailIcon className={cn('size-4', tone.text)} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-semibold text-foreground">
            {email}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                tone.bgSoft,
                tone.text,
              )}
            >
              <span aria-hidden className={cn('size-1.5 rounded-full', tone.dot)} />
              {roleName}
            </span>
            <span className="hidden sm:inline">
              {t('sentAt', {
                date: formatter.dateTime(new Date(invitation.createdAt), {
                  dateStyle: 'medium',
                }),
              })}
            </span>
            {expiresInDays !== null ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  expiringSoon && 'font-medium text-amber-600 dark:text-amber-400',
                )}
              >
                <TimerIcon className="size-3" />
                {expiringSoon
                  ? t('expiresSoon')
                  : t('expiresIn', { days: expiresInDays })}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRevoke}
          disabled={pendingRevoke || !canManageCollaborators}
          title={!canManageCollaborators ? insufficientTitle : undefined}
          className="h-8 gap-1.5 bg-background px-2.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <Trash2Icon className="size-3.5" />
          <span className="hidden lg:inline">{tActions('revoke')}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={tActions('menu')}
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontalIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={4} className="w-48">
            <DropdownMenuItem
              variant="destructive"
              onClick={onRevoke}
              disabled={!canManageCollaborators}
              title={!canManageCollaborators ? insufficientTitle : undefined}
            >
              <Trash2Icon />
              {tActions('revoke')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

function EmptyInvitations() {
  const t = useTranslations('teach-products.editor.team.invitations.empty');
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
        <MailIcon className="size-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t('title')}</p>
      <p className="max-w-xs text-xs leading-snug text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}

function InvitationsSkeleton() {
  return (
    <ul className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i}>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
