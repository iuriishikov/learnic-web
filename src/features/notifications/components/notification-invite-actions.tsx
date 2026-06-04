'use client';

import { CheckIcon, ExternalLinkIcon, Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import type { CollaborationSnapshot } from '../model/types';
import {
  acceptInvitationFromNotificationAction,
  declineInvitationFromNotificationAction,
} from '../api/invite-actions';

type Status = 'idle' | 'pending' | 'accepted' | 'unavailable';
type UnavailableReason = 'revoked' | 'declined' | 'expired' | 'unavailable';

type InitialResolution = {
  status: Extract<Status, 'idle' | 'accepted' | 'unavailable'>;
  unavailableReason: UnavailableReason;
};

type NotificationInviteActionsProps = {
  collaborationId: string;
  productId: string;
  /**
   * Live snapshot of the collaboration, hydrated server-side. Used as
   * the single source of truth for the initial Accept / Decline UI
   * state — a reload picks up the latest values, so the component
   * does not need to remember outcomes locally across mounts.
   */
  collaboration: CollaborationSnapshot | null;
  /** Callback to mark the source notification as read after a terminal state. */
  onResolved?: () => void;
};

function deriveInitialResolution(
  collaboration: CollaborationSnapshot | null,
): InitialResolution {
  if (collaboration === null) {
    return { status: 'unavailable', unavailableReason: 'unavailable' };
  }
  if (collaboration.status === 'active') {
    return { status: 'accepted', unavailableReason: 'unavailable' };
  }
  if (collaboration.status === 'declined') {
    return { status: 'unavailable', unavailableReason: 'declined' };
  }
  if (collaboration.status === 'revoked') {
    return { status: 'unavailable', unavailableReason: 'revoked' };
  }
  if (
    collaboration.inviteExpiresAt !== null &&
    new Date(collaboration.inviteExpiresAt).getTime() <= Date.now()
  ) {
    return { status: 'unavailable', unavailableReason: 'expired' };
  }
  return { status: 'idle', unavailableReason: 'unavailable' };
}

/**
 * Real Accept / Decline pair shown inside an `invite_sent` card.
 *
 * Both actions hit the in-app endpoints and the backend updates the
 * collaboration row, which the notification reader joins on every
 * fetch. The recipient's notification is republished on the WS
 * channel as `updated` after each outcome so other tabs / devices
 * reflect the change immediately. Initial status is derived from
 * the live collaboration snapshot rather than from local component
 * state — that's what survives a page reload.
 */
export function NotificationInviteActions({
  collaborationId,
  productId,
  collaboration,
  onResolved,
}: NotificationInviteActionsProps) {
  const t = useTranslations('notifications');
  const notify = useNotify();
  const router = useRouter();
  const initial = useMemo(
    () => deriveInitialResolution(collaboration),
    [collaboration],
  );
  const [status, setStatus] = useState<Status>(initial.status);
  const [unavailableReason, setUnavailableReason] = useState<UnavailableReason>(
    initial.unavailableReason,
  );
  const [isNavigating, startNavigating] = useTransition();

  const editorHref = `/products/${productId}/editor`;
  const disabled =
    status === 'pending' || status === 'accepted' || status === 'unavailable';

  async function handleAccept() {
    if (disabled) return;
    setStatus('pending');
    const result = await acceptInvitationFromNotificationAction({
      collaborationId,
    });
    if (result.ok) {
      setStatus('accepted');
      onResolved?.();
      startNavigating(() => router.push(editorHref));
      return;
    }
    if (result.reason === 'not-found' || result.reason === 'forbidden') {
      setStatus('unavailable');
      setUnavailableReason('revoked');
      onResolved?.();
      return;
    }
    if (result.reason === 'expired') {
      setStatus('unavailable');
      setUnavailableReason('expired');
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
    notify.error(t('actions.unavailable'));
  }

  async function handleDecline() {
    if (disabled) return;
    setStatus('pending');
    const result = await declineInvitationFromNotificationAction({
      collaborationId,
    });
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
    if (result.reason === 'expired') {
      setStatus('unavailable');
      setUnavailableReason('expired');
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
    notify.error(t('actions.unavailable'));
  }

  if (status === 'accepted') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => router.push(editorHref)}
          disabled={isNavigating}
          className="h-8 gap-1.5"
        >
          {isNavigating ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <ExternalLinkIcon className="size-3.5" aria-hidden />
          )}
          {t('actions.open')}
        </Button>
        <span
          className={cn(
            'inline-flex h-7 items-center gap-1 rounded-md',
            'bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700',
            'ring-1 ring-emerald-500/20 dark:text-emerald-400',
          )}
        >
          <CheckIcon className="size-3.5" aria-hidden />
          {t('actions.accept')}
        </span>
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled
          className="h-8"
        >
          {t('actions.decline')}
        </Button>
        <Button type="button" size="sm" disabled className="h-8">
          {t('actions.accept')}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t(`actions.${unavailableReason}`)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleDecline}
        disabled={status === 'pending'}
        className="h-8"
      >
        {t('actions.decline')}
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
        {status === 'pending' ? t('actions.accepting') : t('actions.accept')}
      </Button>
    </div>
  );
}
