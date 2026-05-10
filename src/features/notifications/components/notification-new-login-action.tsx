'use client';

import { CheckIcon, Loader2Icon, LogOutIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import { revokeSessionFromNotificationAction } from '../api/session-actions';

type Status = 'idle' | 'pending' | 'revoked' | 'unavailable';

type NotificationNewLoginActionProps = {
  sessionId: string;
  /**
   * Server-side liveness flag for the session at read time. ``true``
   * means the refresh-token family is already revoked / expired /
   * gone — the CTA renders the "already gone" pill instead of the
   * red button. The local "I just clicked Logout" status doesn't
   * survive a reload, but this flag does.
   */
  sessionRevoked: boolean;
  /** Callback to mark the source notification as read after a terminal state. */
  onResolved?: () => void;
};

export function NotificationNewLoginAction({
  sessionId,
  sessionRevoked,
  onResolved,
}: NotificationNewLoginActionProps) {
  const t = useTranslations('notifications');
  const notify = useNotify();
  const [status, setStatus] = useState<Status>(
    sessionRevoked ? 'unavailable' : 'idle',
  );

  async function handleRevoke() {
    if (status !== 'idle') return;
    setStatus('pending');
    const result = await revokeSessionFromNotificationAction({ sessionId });
    if (result.ok) {
      setStatus('revoked');
      onResolved?.();
      return;
    }
    if (result.reason === 'not-found') {
      setStatus('unavailable');
      onResolved?.();
      return;
    }
    setStatus('idle');
    notify.error(t('actions.newLoginRevokeFailed'));
  }

  if (status === 'revoked') {
    return (
      <span
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-md',
          'bg-emerald-500/10 px-2 text-xs font-medium text-emerald-700',
          'ring-1 ring-emerald-500/20 dark:text-emerald-400',
        )}
      >
        <CheckIcon className="size-3.5" aria-hidden />
        {t('actions.newLoginRevoked')}
      </span>
    );
  }

  if (status === 'unavailable') {
    return (
      <span className="text-xs text-muted-foreground">
        {t('actions.newLoginAlreadyRevoked')}
      </span>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      onClick={handleRevoke}
      disabled={status === 'pending'}
      className="h-8 gap-1.5"
    >
      {status === 'pending' ? (
        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <LogOutIcon className="size-3.5" aria-hidden />
      )}
      {status === 'pending'
        ? t('actions.newLoginRevoking')
        : t('actions.newLoginRevoke')}
    </Button>
  );
}
