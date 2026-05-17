'use client';

import { MailIcon } from 'lucide-react';

import type { InputVariantProps } from './common';
import {
  InputShell,
  LeadingIcon,
  ShellInput,
  SwapIndicator,
  TrailingSlot,
} from './shell';

export function EmailInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
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
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}
