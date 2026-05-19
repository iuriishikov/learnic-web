'use client';

import { MailIcon } from 'lucide-react';

import type { InputVariantProps } from './common';
import {
  ErrorIndicator,
  InputShell,
  LeadingIcon,
  ShellInput,
  TrailingSlot,
} from './shell';

export function EmailInput({
  invalid,
  disabled,
  previewFocused,
  className,
  ...props
}: InputVariantProps) {
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <LeadingIcon>
        <MailIcon />
      </LeadingIcon>
      <ShellInput
        type="email"
        inputMode="email"
        autoComplete="email"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pl-2"
        {...props}
      />
      {invalid ? (
        <TrailingSlot>
          <ErrorIndicator />
        </TrailingSlot>
      ) : null}
    </InputShell>
  );
}
