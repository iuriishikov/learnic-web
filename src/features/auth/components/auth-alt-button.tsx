'use client';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import { appendFrom } from '../lib/redirect';

type AuthAltButtonProps = {
  href: '/login' | '/register';
  label: string;
  disabled?: boolean;
  className?: string;
  from?: string | null;
};

export function AuthAltButton({
  href,
  label,
  disabled,
  className,
  from,
}: AuthAltButtonProps) {
  const target = appendFrom(href, from);
  return (
    <Button
      variant="outline"
      disabled={disabled}
      className={cn(
        'h-11 w-full rounded-lg px-4 text-[15px] font-normal text-foreground',
        className,
      )}
      render={<Link href={target} />}
      nativeButton={false}
    >
      {label}
    </Button>
  );
}
