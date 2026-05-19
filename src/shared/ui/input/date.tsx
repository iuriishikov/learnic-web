'use client';

import { CalendarIcon } from 'lucide-react';

import type { InputVariantProps } from './common';
import {
  InputShell,
  LeadingIcon,
  ShellInput,
  SwapIndicator,
  TrailingSlot,
} from './shell';

export function DateTimeInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  placeholder = 'MM/DD/YYYY – 00:00',
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
        <CalendarIcon />
      </LeadingIcon>
      <ShellInput
        type="text"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pl-2 tabular-nums"
        placeholder={placeholder}
        {...props}
      />
      {invalid || helpTooltip != null ? (
        <TrailingSlot>
          <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
        </TrailingSlot>
      ) : null}
    </InputShell>
  );
}
