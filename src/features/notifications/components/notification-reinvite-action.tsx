'use client';

import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import { reinviteCollaborationFromNotificationAction } from '../api/invite-actions';

type Status = 'idle' | 'pending' | 'sent' | 'unavailable';

type NotificationReinviteActionProps = {
  collaborationId: string;
  /** True when the recipient currently holds `MANAGE_COLLABORATORS`. */
  canManage: boolean;
  onResolved?: () => void;
};

/**
 * Re-invite action rendered inside an `invite_declined` card. Hits
 * `POST /collaborations/{id}/reinvite` which copies the original
 * target and grants into a fresh `PENDING_INVITE` collaboration.
 * Hidden when the recipient has lost `MANAGE_COLLABORATORS`.
 */
export function NotificationReinviteAction({
  collaborationId,
  canManage,
  onResolved,
}: NotificationReinviteActionProps) {
  const t = useTranslations('notifications');
  const notify = useNotify();
  const [status, setStatus] = useState<Status>('idle');

  if (!canManage && status === 'idle') {
    return null;
  }

  if (status === 'sent') {
    return (
      <span
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-md',
          'bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700',
          'ring-1 ring-emerald-500/20 dark:text-emerald-400',
        )}
      >
        {t('actions.reinviteSent')}
      </span>
    );
  }

  if (status === 'unavailable') {
    return (
      <span className="text-xs text-muted-foreground">
        {t('actions.unavailable')}
      </span>
    );
  }

  async function handleReinvite() {
    if (status === 'pending') return;
    setStatus('pending');
    const result = await reinviteCollaborationFromNotificationAction({
      collaborationId,
    });
    if (result.ok) {
      setStatus('sent');
      onResolved?.();
      return;
    }
    if (result.reason === 'forbidden') {
      setStatus('unavailable');
      notify.error(t('actions.noManagePermission'));
      return;
    }
    if (
      result.reason === 'not-found' ||
      result.reason === 'unavailable'
    ) {
      setStatus('unavailable');
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
      onClick={handleReinvite}
      disabled={status === 'pending'}
      className="h-8 gap-1.5"
    >
      {status === 'pending' ? (
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
      ) : null}
      {t('actions.reinvite')}
    </Button>
  );
}
