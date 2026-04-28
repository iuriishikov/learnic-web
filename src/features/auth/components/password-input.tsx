'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { forwardRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  showToggleLabel: string;
  hideToggleLabel: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { className, showToggleLabel, hideToggleLabel, ...props },
    ref,
  ) {
    const [visible, setVisible] = useState(false);
    const Icon = visible ? EyeOffIcon : EyeIcon;
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideToggleLabel : showToggleLabel}
          className="absolute top-1/2 right-3 inline-flex size-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          tabIndex={-1}
        >
          <Icon className="size-[18px]" aria-hidden />
        </button>
      </div>
    );
  },
);
