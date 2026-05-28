'use client';

import {
  CheckCircle2Icon,
  GiftIcon,
  MoreHorizontalIcon,
  RotateCwIcon,
  TimerIcon,
  Trash2Icon,
  XCircleIcon,
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
import { useProductGifts, useRevokeGiftMutation } from '../../api/use-gifts';
import type { Gift, GiftStatus } from '../../model/gifts';

import { daysUntil } from './team-shared';

export function TeamGiftsTab({
  productId,
  onAddGift,
}: {
  productId: string;
  onAddGift: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.gifts');
  const tLoad = useTranslations('teach-products.editor.team.load');
  const tEditor = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();

  const giftsQuery = useProductGifts(productId);
  const revoke = useRevokeGiftMutation(productId);
  const perms = useProductPermissions(productId);
  const canManageCollaborators = perms.canManageCollaborators;
  const insufficientTitle = tEditor('insufficientPermissions');

  // Show pending + accepted; terminal (declined/revoked) are audit-only
  // and omitted from the active list, mirroring the invitations tab.
  const gifts = useMemo<Gift[]>(() => {
    if (!giftsQuery.data) return [];
    return giftsQuery.data.filter(
      (g) => g.status === 'pending_invite' || g.status === 'accepted',
    );
  }, [giftsQuery.data]);

  const isLoading = giftsQuery.isPending;
  const hasError = giftsQuery.isError;

  return (
    <motion.div
      key="gifts-tab"
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
          onClick={onAddGift}
          disabled={!canManageCollaborators}
          title={!canManageCollaborators ? insufficientTitle : undefined}
          className="h-9 shrink-0 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:px-4"
        >
          <GiftIcon className="size-4" />
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
            {t('errorDescription')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => giftsQuery.refetch()}
            disabled={giftsQuery.isFetching}
            className="h-8 w-fit gap-1.5"
          >
            <RotateCwIcon
              className={cn('size-3.5', giftsQuery.isFetching && 'animate-spin')}
            />
            {tLoad('retry')}
          </Button>
        </div>
      ) : isLoading ? (
        <GiftsSkeleton />
      ) : gifts.length === 0 ? (
        <EmptyGifts />
      ) : (
        <ul className="flex flex-col gap-2">
          {gifts.map((gift) => (
            <li key={gift.id}>
              <GiftCard
                gift={gift}
                canManageCollaborators={canManageCollaborators}
                insufficientTitle={insufficientTitle}
                onRevoke={() => revoke.mutate({ giftId: gift.id })}
                pendingRevoke={
                  revoke.isPending && revoke.variables?.giftId === gift.id
                }
              />
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function GiftStatusBadge({ status }: { status: GiftStatus }) {
  const t = useTranslations('teach-products.editor.team.gifts.status');
  // Exhaustive over GiftStatus — every variant gets an explicit tone.
  switch (status) {
    case 'pending_invite':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-foreground/10 dark:text-amber-400">
          <TimerIcon className="size-3" aria-hidden />
          {t('pending')}
        </span>
      );
    case 'accepted':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-foreground/10 dark:text-emerald-400">
          <CheckCircle2Icon className="size-3" aria-hidden />
          {t('accepted')}
        </span>
      );
    case 'declined':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10">
          <XCircleIcon className="size-3" aria-hidden />
          {t('declined')}
        </span>
      );
    case 'revoked':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10">
          <XCircleIcon className="size-3" aria-hidden />
          {t('revoked')}
        </span>
      );
  }
}

function GiftCard({
  gift,
  canManageCollaborators,
  insufficientTitle,
  onRevoke,
  pendingRevoke,
}: {
  gift: Gift;
  canManageCollaborators: boolean;
  insufficientTitle: string;
  onRevoke: () => void;
  pendingRevoke: boolean;
}) {
  const t = useTranslations('teach-products.editor.team.gifts');
  const tActions = useTranslations('teach-products.editor.team.gifts.actions');
  const formatter = useFormatter();

  const recipientLabel =
    gift.recipient?.fullName.trim() ||
    gift.recipient?.email ||
    gift.invitedEmail ||
    '';
  const subtitle = gift.recipient?.email ?? gift.invitedEmail ?? '';
  const expiresInDays =
    gift.status === 'pending_invite' ? daysUntil(gift.inviteExpiresAt) : null;
  const expiringSoon = expiresInDays !== null && expiresInDays <= 1;
  // A gift can only be revoked while pending; once accepted, access is granted.
  const canRevoke = gift.status === 'pending_invite';

  return (
    <article
      className={cn(
        'group/gift flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-foreground/15 sm:flex-row sm:items-center sm:gap-5',
        pendingRevoke && 'opacity-60',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 ring-1 ring-foreground/10">
          <GiftIcon className="size-4 text-brand" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-semibold text-foreground">
            {recipientLabel || '—'}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <GiftStatusBadge status={gift.status} />
            {subtitle && subtitle !== recipientLabel ? (
              <span className="truncate">{subtitle}</span>
            ) : null}
            <span className="hidden sm:inline">
              {t('sentAt', {
                date: formatter.dateTime(new Date(gift.createdAt), {
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
                <TimerIcon className="size-3" aria-hidden />
                {expiringSoon
                  ? t('expiresSoon')
                  : t('expiresIn', { days: expiresInDays })}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {canRevoke ? (
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
            <Trash2Icon className="size-3.5" aria-hidden />
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
      ) : null}
    </article>
  );
}

function EmptyGifts() {
  const t = useTranslations('teach-products.editor.team.gifts.empty');
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
        <GiftIcon className="size-5" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-foreground">{t('title')}</p>
      <p className="max-w-xs text-xs leading-snug text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}

function GiftsSkeleton() {
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
