'use client';

import type { InputVariantProps } from './common';
import {
  InputShell,
  LeadingIcon,
  ShellInput,
  SwapIndicator,
  TrailingSlot,
} from './shell';

// Card-number input — currently shows a MasterCard mark; brand detection
// (Visa / Amex / Mir) lives near here when it lands, not deep in `_shared`.
function MasterCardIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="9" cy="8" r="6.5" fill="#EB001B" opacity={filled ? 1 : 0.35} />
      <circle cx="15" cy="8" r="6.5" fill="#F79E1B" opacity={filled ? 1 : 0.35} />
      <path
        d="M12 3.2A6.49 6.49 0 0 0 9.5 8a6.49 6.49 0 0 0 2.5 4.8A6.49 6.49 0 0 0 14.5 8 6.49 6.49 0 0 0 12 3.2Z"
        fill="#FF5F00"
        opacity={filled ? 1 : 0.35}
      />
    </svg>
  );
}

export function CardNumberInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  value,
  placeholder = '1234 1234 1234 1234',
  ...props
}: InputVariantProps) {
  const hasValue = Boolean(value);
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <LeadingIcon className="pr-1">
        <MasterCardIcon filled={hasValue} />
      </LeadingIcon>
      <ShellInput
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        className="pl-2 tabular-nums"
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}
