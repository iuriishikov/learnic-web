'use client';

import * as React from 'react';

import type { InputVariantProps } from './common';
import { EmbeddedChevron, EmbeddedPicker } from './embedded-picker';
import {
  InputShell,
  ShellInput,
  SideAddon,
  SwapIndicator,
  TrailingSlot,
} from './shell';

type Currency = { value: string; label: string };

type MoneyInputProps = InputVariantProps & {
  currencies: Currency[];
  currency?: string;
  defaultCurrency?: string;
  onCurrencyChange?: (value: string) => void;
  prefix?: string;
};

// Currency prefix + amount + currency-selector suffix. Use when the
// amount is bound to a user-pickable currency. For a fixed-currency
// field, prefer `TextInput` with `leadingIcon` rendering the symbol.
export function MoneyInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  currencies,
  currency,
  defaultCurrency,
  onCurrencyChange,
  prefix = '$',
  placeholder = '1,000.00',
  ...props
}: MoneyInputProps) {
  const [internal, setInternal] = React.useState(
    defaultCurrency ?? currencies[0]?.value ?? 'USD',
  );
  const value = currency ?? internal;

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <SideAddon align="inline-start">
        <span className="inline-flex h-full items-center pl-3 pr-2 text-sm font-medium text-muted-foreground select-none">
          {prefix}
        </span>
      </SideAddon>
      <ShellInput
        type="text"
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        className="text-foreground tabular-nums"
        {...props}
      />
      <TrailingSlot className="pr-1">
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
      <SideAddon>
        <EmbeddedPicker
          ariaLabel="Currency"
          align="end"
          disabled={disabled}
          value={value}
          onChange={(v) => {
            if (currency === undefined) setInternal(v);
            onCurrencyChange?.(v);
          }}
          options={currencies.map((c) => ({
            value: c.value,
            label: `${c.value} — ${c.label}`,
          }))}
          triggerClassName="pl-2 pr-3"
          renderTrigger={(_sel, open) => (
            <>
              <span className="font-medium">{value}</span>
              <EmbeddedChevron open={open} />
            </>
          )}
        />
      </SideAddon>
    </InputShell>
  );
}
