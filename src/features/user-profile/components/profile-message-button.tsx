'use client';

import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type ProfileMessageButtonProps = {
  className?: string;
};

/**
 * Honest placeholder — direct messages have no backend yet, so the CTA
 * announces "in development" via a toast instead of navigating to a dead
 * chat route. Wire it back to `/users/{id}/chat` once messaging ships.
 */
export function ProfileMessageButton({
  className,
}: ProfileMessageButtonProps) {
  const t = useTranslations('user-profile.actions');
  const notify = useNotify();

  const onWriteMessage = () => {
    notify.info(t('writeMessageSoonTitle'), {
      description: t('writeMessageSoonDescription'),
    });
  };

  return (
    <Button
      type="button"
      size="lg"
      variant="default"
      onClick={onWriteMessage}
      className={cn('h-10 px-4 text-sm font-semibold', className)}
    >
      {t('writeMessage')}
    </Button>
  );
}
