'use client';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

type AuthAltButtonProps = {
  href: '/login' | '/register';
  label: string;
  disabled?: boolean;
  className?: string;
};

export function AuthAltButton({
  href,
  label,
  disabled,
  className,
}: AuthAltButtonProps) {
  return (
    <Button
      variant="outline"
      disabled={disabled}
      className={cn(
        'h-11 w-full rounded-lg px-4 text-[15px] font-semibold',
        className,
      )}
      render={<Link href={href} />}
      nativeButton={false}
    >
      {label}
    </Button>
  );
}
