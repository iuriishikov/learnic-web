'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import { InputShell, ShellInput } from '@/shared/ui/input-extended';

// `CompactInput` is the same visual language as `TextInput` from
// `input-extended` (border, focus ring, hover state, invalid styles) shrunk
// to fit inside the color popover — `h-8` instead of the default `h-10`.
//
// Use `leading` / `trailing` slots for the color-dot or "%" addon, and pass
// any normal `<input>` props otherwise.

type CompactInputProps = Omit<
  React.ComponentProps<'input'>,
  'disabled' | 'className'
> & {
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Override the shell's class — e.g. width / flex-basis. */
  shellClassName?: string;
};

export function CompactInput({
  invalid,
  disabled,
  className,
  leading,
  trailing,
  shellClassName,
  ...inputProps
}: CompactInputProps) {
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      className={cn('h-8 rounded-md', shellClassName)}
    >
      {leading}
      <ShellInput
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          'px-1.5 text-xs',
          leading != null && 'pl-1',
          trailing != null && 'pr-1',
          className,
        )}
        {...inputProps}
      />
      {trailing}
    </InputShell>
  );
}

export function CompactInputAddon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none flex h-full shrink-0 items-center px-1.5 text-xs text-muted-foreground/80',
        className,
      )}
    >
      {children}
    </span>
  );
}
