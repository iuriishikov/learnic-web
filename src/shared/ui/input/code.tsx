'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import type { CommonInputProps } from './common';

type CodeInputProps = CommonInputProps & {
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
};

// OTP / verification-code input: `length` (default 4) single-digit boxes
// with paste handling, arrow-key navigation, and backspace-to-prev.
export function CodeInput({
  invalid,
  disabled,
  previewFocused,
  length = 4,
  value,
  onValueChange,
  className,
}: CodeInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const [internal, setInternal] = React.useState(value ?? '');
  const current = value ?? internal;

  function setValue(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = current.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    const next = chars.join('').replace(/\s+$/, '');
    setValue(next);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
      inputsRef.current[index - 1]?.select();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
      inputsRef.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  }

  function handlePaste(
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) {
    const data = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!data) return;
    e.preventDefault();
    const chars = current.split('');
    for (let i = 0; i < data.length && index + i < length; i++) {
      chars[index + i] = data[i];
    }
    const next = chars.join('').slice(0, length);
    setValue(next);
    const focusIndex = Math.min(index + data.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
    inputsRef.current[focusIndex]?.select();
  }

  return (
    <div
      data-slot="code-input"
      className={cn('flex items-center gap-2', className)}
    >
      {Array.from({ length }).map((_, i) => {
        const ch = current[i] ?? '';
        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={ch}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              'h-12 w-12 rounded-lg border border-input bg-transparent text-center text-2xl font-medium text-foreground shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 outline-none',
              'placeholder:text-muted-foreground/60',
              'focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20',
              'disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60',
              'dark:bg-input/30',
              previewFocused && 'border-ring ring-4 ring-ring/20',
              invalid &&
                'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
              invalid &&
                previewFocused &&
                'border-destructive ring-destructive/20',
              'aria-[invalid=true]:text-destructive',
            )}
          />
        );
      })}
    </div>
  );
}
