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

type PhoneCountry = {
  value: string;
  label: string;
  prefix: string;
};

type PhoneInputProps = InputVariantProps & {
  countries: PhoneCountry[];
  country?: string;
  defaultCountry?: string;
  onCountryChange?: (value: string) => void;
};

export function PhoneInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  countries,
  country,
  defaultCountry,
  onCountryChange,
  placeholder = '+1 (555) 000-0000',
  ...props
}: PhoneInputProps) {
  const [internal, setInternal] = React.useState(
    defaultCountry ?? countries[0]?.value ?? '',
  );
  const value = country ?? internal;

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <SideAddon align="inline-start">
        <EmbeddedPicker
          ariaLabel="Country"
          align="start"
          disabled={disabled}
          value={value}
          onChange={(v) => {
            if (country === undefined) setInternal(v);
            onCountryChange?.(v);
          }}
          options={countries.map((c) => ({
            value: c.value,
            label: `${c.value} — ${c.label}`,
            meta: c.prefix,
          }))}
          triggerClassName="pl-3 pr-2"
          renderTrigger={(_sel, open) => (
            <>
              <span className="font-medium">{value}</span>
              <EmbeddedChevron open={open} />
            </>
          )}
        />
      </SideAddon>
      <ShellInput
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        aria-invalid={invalid || undefined}
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
