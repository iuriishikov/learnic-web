'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/shared/ui/input-group';

const ANY_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

function stripScheme(v: string): string {
  return v.replace(ANY_SCHEME, '');
}

type HttpsUrlInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  /**
   * Full URL with `https?://` prefix as stored on the wire. The prefix
   * is rendered as a non-editable addon, so only the host + path is
   * shown in the textbox. An empty string means "unset".
   */
  value: string;
  onValueChange: (next: string) => void;
  groupClassName?: string;
};

function HttpsUrlInput({
  value,
  onValueChange,
  className,
  groupClassName,
  ...props
}: HttpsUrlInputProps) {
  const rest = stripScheme(value);
  return (
    <InputGroup className={cn(groupClassName)}>
      <InputGroupAddon align="inline-start">
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="url"
        inputMode="url"
        autoComplete="url"
        value={rest}
        onChange={(event) => {
          const next = stripScheme(event.target.value);
          onValueChange(next === '' ? '' : `https://${next}`);
        }}
        className={className}
        {...props}
      />
    </InputGroup>
  );
}

export { HttpsUrlInput };
