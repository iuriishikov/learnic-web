'use client';

import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import type { CollaborationSnapshot } from '../model/types';
import { revokeCollaborationFromNotificationAction } from '../api/invite-actions';

type Status = 'idle' | 'pending' | 'revoked' | 'unavailable';
type UnavailableReason = 'left' | 'revoked' | 'unavailable';

type NotificationRevokeActionProps = {
  collaborationId: string;
  /**
   * Live snapshot of the collaboration. The Revoke CTA is only
   * useful while ``status === 'active'`` — terminal statuses
   * (``revoked`` / ``declined``) collapse the action to a status
   * pill without a button.
   */
  collaboration: CollaborationSnapshot | null;
  /** True when the recipient currently holds `MANAGE_COLLABORATORS`. */
  canManage: boolean;
  onResolved?: () => void;
};

function deriveInitialState(
  collaboration: CollaborationSnapshot | null,
): { status: Status; reason: UnavailableReason } {
  if (collaboration === null) {
    return { status: 'unavailable', reason: 'unavailable' };
  }
  if (collaboration.status === 'revoked') {
    return { status: 'revoked', reason: 'revoked' };
  }
  if (collaboration.status !== 'active') {
    return { status: 'unavailable', reason: 'left' };
  }
  return { status: 'idle', reason: 'unavailable' };
}

/**
 * Revoke-collaborator action rendered inside an `invite_accepted`
 * card. Available only while the underlying collaboration is still
 * active and the recipient holds `MANAGE_COLLABORATORS`. Hits the
 * standard `DELETE /collaborations/{id}` endpoint and lets the
 * server-side notification republish flip the embedded snapshot.
 */
export function NotificationRevokeAction({
  collaborationId,
  collaboration,
  canManage,
  onResolved,
}: NotificationRevokeActionProps) {
  const t = useTranslations('notifications');
  const notify = useNotify();
  const initial = deriveInitialState(collaboration);
  const [status, setStatus] = useState<Status>(initial.status);
  const [reason, setReason] = useState<UnavailableReason>(initial.reason);

  if (!canManage && status === 'idle') {
    return null;
  }

  if (status === 'revoked') {
    return (
      <span
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-md',
          'bg-muted px-2 text-xs font-medium text-muted-foreground',
          'ring-1 ring-border',
        )}
      >
        {t('actions.revokedDone')}
      </span>
    );
  }

  if (status === 'unavailable') {
    return (
      <span className="text-xs text-muted-foreground">
        {t(`actions.${reason === 'left' ? 'collaboratorLeft' : 'unavailable'}`)}
      </span>
    );
  }

  async function handleRevoke() {
    if (status === 'pending') return;
    if (!canManage) {
      setStatus('unavailable');
      setReason('unavailable');
      notify.error(t('actions.noManagePermission'));
      return;
    }
    if (collaboration === null) {
      setStatus('unavailable');
      setReason('unavailable');
      onResolved?.();
      return;
    }
    if (collaboration.status === 'revoked') {
      setStatus('revoked');
      setReason('revoked');
      onResolved?.();
      return;
    }
    if (collaboration.status !== 'active') {
      setStatus('unavailable');
      setReason('left');
      notify.error(t('actions.collaboratorLeft'));
      onResolved?.();
      return;
    }
    setStatus('pending');
    const result = await revokeCollaborationFromNotificationAction({
      collaborationId,
    });
    if (result.ok) {
      setStatus('revoked');
      setReason('revoked');
      onResolved?.();
      return;
    }
    if (result.reason === 'forbidden') {
      setStatus('unavailable');
      setReason('unavailable');
      notify.error(t('actions.noManagePermission'));
      return;
    }
    if (result.reason === 'not-found') {
      setStatus('unavailable');
      setReason('unavailable');
      onResolved?.();
      return;
    }
    if (result.reason === 'unavailable') {
      setStatus('unavailable');
      setReason('unavailable');
      onResolved?.();
      return;
    }
    setStatus('idle');
    notify.error(t('actions.unavailable'));
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleRevoke}
      disabled={status === 'pending'}
      className="h-8 gap-1.5"
    >
      {status === 'pending' ? (
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
      ) : null}
      {t('actions.revoke')}
    </Button>
  );
}
