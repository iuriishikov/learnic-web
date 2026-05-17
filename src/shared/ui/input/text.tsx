'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import type { CommonInputProps } from './common';
import {
  InputShell,
  LeadingIcon,
  ShellInput,
  SwapIndicator,
  TrailingSlot,
} from './shell';

// Generic single-line input matching the new design. Drop-in
// replacement for the legacy `Input` primitive. Optional leading icon,
// trailing "?" help tooltip when `helpTooltip` is provided.
//
// Unlike other variants in this package, `TextInput` does NOT omit
// `type` from the underlying `<input>` props — callers can pass
// `type="text"`, `type="search"`, `type="tel"`, etc. freely. The
// dedicated variants (Email, Password, Date, Phone, …) exist for
// shapes that need *more* than just a different `type`.
type TextInputProps = Omit<
  React.ComponentProps<'input'>,
  'disabled' | 'className'
> &
  CommonInputProps & {
    leadingIcon?: React.ReactNode;
    trailingIcon?: React.ReactNode;
    /** When false (default), the "?" tooltip icon is hidden if no helpTooltip is set. */
    alwaysShowHelp?: boolean;
  };

export function TextInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  leadingIcon,
  trailingIcon,
  alwaysShowHelp,
  ...props
}: TextInputProps) {
  const showTrailing =
    trailingIcon != null || invalid || helpTooltip != null || alwaysShowHelp;
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      {leadingIcon != null && <LeadingIcon>{leadingIcon}</LeadingIcon>}
      <ShellInput
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(leadingIcon != null && 'pl-2')}
        {...props}
      />
      {showTrailing ? (
        <TrailingSlot>
          {trailingIcon != null ? (
            trailingIcon
          ) : (
            <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
          )}
        </TrailingSlot>
      ) : null}
    </InputShell>
  );
}
