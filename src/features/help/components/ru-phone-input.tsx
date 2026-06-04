'use client';

import {
  Divider,
  ErrorIndicator,
  InputShell,
  ShellInput,
  SideAddon,
  TrailingSlot,
} from '@/shared/ui/input-extended';

import {
  formatRuPhone,
  RU_DIAL_PREFIX,
  RU_PHONE_PLACEHOLDER,
} from '../lib/ru-phone';

type RuPhoneInputProps = {
  id?: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  className?: string;
  placeholder?: string;
};

/**
 * Russia-only phone field: a fixed, non-editable `+7` prefix addon followed
 * by a masked input that formats the 10 national digits as `(XXX) XXX-XX-XX`
 * while typing. Controlled — the parent owns the formatted value.
 */
export function RuPhoneInput({
  id,
  name,
  value,
  onValueChange,
  onBlur,
  invalid,
  className,
  placeholder = RU_PHONE_PLACEHOLDER,
}: RuPhoneInputProps) {
  return (
    <InputShell invalid={invalid} className={className}>
      <SideAddon align="inline-start">
        <span className="flex items-center px-3 text-sm font-medium text-foreground select-none">
          {RU_DIAL_PREFIX}
        </span>
      </SideAddon>
      <Divider />
      <ShellInput
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(event) => onValueChange(formatRuPhone(event.target.value))}
        onBlur={onBlur}
        className="pl-3 tabular-nums"
      />
      {invalid ? (
        <TrailingSlot>
          <ErrorIndicator />
        </TrailingSlot>
      ) : null}
    </InputShell>
  );
}
