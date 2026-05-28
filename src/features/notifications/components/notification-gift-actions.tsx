'use client';

import { CheckIcon, ExternalLinkIcon, Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import type { GiftSnapshot } from '../model/types';
import {
  acceptGiftFromNotificationAction,
  declineGiftFromNotificationAction,
} from '../api/gift-actions';

type Status = 'idle' | 'pending' | 'accepted' | 'unavailable';
type UnavailableReason = 'revoked' | 'declined' | 'expired' | 'unavailable';

type InitialResolution = {
  status: Extract<Status, 'idle' | 'accepted' | 'unavailable'>;
  unavailableReason: UnavailableReason;
};

type NotificationGiftActionsProps = {
  giftId: string;
  /**
   * Live snapshot of the gift, hydrated server-side. Single source of
   * truth for the initial Accept / Decline UI state — a reload picks
   * up the latest values, so the component does not need to remember
   * outcomes locally across mounts.
   */
  gift: GiftSnapshot | null;
  /** Callback to mark the source notification as read after a terminal state. */
  onResolved?: () => void;
};

function deriveInitialResolution(
  gift: GiftSnapshot | null,
): InitialResolution {
  if (gift === null) {
    return { status: 'unavailable', unavailableReason: 'unavailable' };
  }
  // Exhaustive over GiftStatus — every variant is handled explicitly.
  switch (gift.status) {
    case 'accepted':
      return { status: 'accepted', unavailableReason: 'unavailable' };
    case 'declined':
      return { status: 'unavailable', unavailableReason: 'declined' };
    case 'revoked':
      return { status: 'unavailable', unavailableReason: 'revoked' };
    case 'pending_invite': {
      if (
        gift.inviteExpiresAt !== null &&
        new Date(gift.inviteExpiresAt).getTime() <= Date.now()
      ) {
        return { status: 'unavailable', unavailableReason: 'expired' };
      }
      return { status: 'idle', unavailableReason: 'unavailable' };
    }
  }
}

/**
 * Real Accept / Decline pair shown inside a `gift_received` card.
 *
 * Both actions hit the in-app gift endpoints; the backend updates the
 * gift row, which the notification reader joins on every fetch. Initial
 * status is derived from the live gift snapshot rather than from local
 * component state — that's what survives a page reload. On accept the
 * recipient is enrolled, so we route them to the catalogue.
 */
export function NotificationGiftActions({
  giftId,
  gift,
  onResolved,
}: NotificationGiftActionsProps) {
  const t = useTranslations('notifications');
  const notify = useNotify();
  const router = useRouter();
  const initial = useMemo(() => deriveInitialResolution(gift), [gift]);
  const [status, setStatus] = useState<Status>(initial.status);
  const [unavailableReason, setUnavailableReason] = useState<UnavailableReason>(
    initial.unavailableReason,
  );
  const [isNavigating, startNavigating] = useTransition();

  const courseHref = '/marketplace';
  const disabled =
    status === 'pending' || status === 'accepted' || status === 'unavailable';

  async function handleAccept() {
    if (disabled) return;
    setStatus('pending');
    const result = await acceptGiftFromNotificationAction({ giftId });
    if (result.ok) {
      setStatus('accepted');
      onResolved?.();
      startNavigating(() => router.push(courseHref));
      return;
    }
    if (result.reason === 'not-found' || result.reason === 'forbidden') {
      setStatus('unavailable');
      setUnavailableReason('revoked');
      onResolved?.();
      return;
    }
    if (result.reason === 'unavailable') {
      setStatus('unavailable');
      setUnavailableReason('unavailable');
      onResolved?.();
      return;
    }
    setStatus('idle');
    notify.error(t('giftActions.unavailable'));
  }

  async function handleDecline() {
    if (disabled) return;
    setStatus('pending');
    const result = await declineGiftFromNotificationAction({ giftId });
    if (result.ok) {
      setStatus('unavailable');
      setUnavailableReason('declined');
      onResolved?.();
      return;
    }
    if (result.reason === 'not-found' || result.reason === 'forbidden') {
      setStatus('unavailable');
      setUnavailableReason('revoked');
      onResolved?.();
      return;
    }
    if (result.reason === 'unavailable') {
      setStatus('unavailable');
      setUnavailableReason('unavailable');
      onResolved?.();
      return;
    }
    setStatus('idle');
    notify.error(t('giftActions.unavailable'));
  }

  if (status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => router.push(courseHref)}
          disabled={isNavigating}
          className="h-8 gap-1.5"
        >
          {isNavigating ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          )}
          {t('giftActions.open')}
        </Button>
        <span
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md',
            'bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700',
            'ring-1 ring-emerald-500/20 dark:text-emerald-400',
          )}
        >
          <CheckIcon className="size-3.5" aria-hidden />
          {t('giftActions.accept')}
        </span>
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled
          className="h-8"
        >
          {t('giftActions.decline')}
        </Button>
        <Button type="button" size="sm" disabled className="h-8">
          {t('giftActions.accept')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t(`giftActions.${unavailableReason}`)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleDecline}
        disabled={status === 'pending'}
        className="h-8"
      >
        {t('giftActions.decline')}
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={handleAccept}
        disabled={status === 'pending'}
        className="h-8 gap-1.5"
      >
        {status === 'pending' ? (
          <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
        ) : null}
        {status === 'pending'
          ? t('giftActions.accepting')
          : t('giftActions.accept')}
      </Button>
    </div>
  );
}
