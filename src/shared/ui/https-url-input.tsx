'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Divider,
  InputShell,
  ShellInput,
  SideAddon,
} from '@/shared/ui/input-extended';

const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

function stripScheme(v: string): string {
  return v.replace(ANY_SCHEME, '');
}

type HttpsUrlInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'className' | 'disabled'
> & {
  /**
   * Full URL with `https?://` prefix as stored on the wire. The prefix
   * is rendered as a non-editable addon, so only the host + path is
   * shown in the textbox. An empty string means "unset".
   */
  value: string;
  onValueChange: (next: string) => void;
  disabled?: boolean;
  /** Class merged onto the bordered shell (height, max-width, radius). */
  groupClassName?: string;
  /** Class merged onto the inner `<input>`. */
  className?: string;
};

function HttpsUrlInput({
  value,
  onValueChange,
  className,
  groupClassName,
  disabled,
  ...props
}: HttpsUrlInputProps) {
  const rest = stripScheme(value);
  return (
    <InputShell disabled={disabled} className={cn(groupClassName)}>
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
        value={rest}
        onChange={(event) => {
          const next = stripScheme(event.target.value);
          onValueChange(next === '' ? '' : `https://${next}`);
        }}
        className={className}
        {...props}
      />
    </InputShell>
  );
}

export { HttpsUrlInput };
