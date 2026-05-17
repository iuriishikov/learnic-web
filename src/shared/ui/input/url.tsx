'use client';

import type { InputVariantProps } from './common';
import {
  Divider,
  InputShell,
  ShellInput,
  SideAddon,
  SwapIndicator,
  TrailingSlot,
} from './shell';

// HTTPS URL input — `https://` prefix is fixed as a side addon; user types
// only the host/path. Use when the wire-shape requires the protocol.
export function HttpsUrlInput({
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
      <SideAddon align="inline-start">
        <span className="inline-flex h-full items-center px-3 text-sm text-muted-foreground select-none">
          https://
        </span>
      </SideAddon>
      <Divider />
      <ShellInput
        type="url"
        inputMode="url"
        autoComplete="url"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}
