'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type ProfileMessageButtonProps = {
  userId: string;
  className?: string;
};

export function ProfileMessageButton({
  userId,
  className,
}: ProfileMessageButtonProps) {
  const t = useTranslations('user-profile.actions');

  return (
    <Button
      size="lg"
      variant="default"
      nativeButton={false}
      render={<Link href={`/users/${userId}/chat`} />}
      className={cn('h-10 px-4 text-sm font-semibold', className)}
    >
      {t('writeMessage')}
    </Button>
  );
}
