'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import type { CommonInputProps } from './common';
import {
  Divider,
  InputShell,
  SideAddon,
  SwapIndicator,
  TrailingSlot,
} from './shell';

type FileInputProps = CommonInputProps & {
  placeholder?: string;
  browseLabel?: string;
  fileName?: string;
  defaultFileName?: string;
  accept?: string;
  onFileSelect?: (file: File | null) => void;
  id?: string;
};

// Native file picker behind a styled "Browse" addon. Shows the picked
// file name (or `placeholder`) in the input area; the button on the
// right and the text area itself both open the picker.
export function FileInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  placeholder = 'No file chosen',
  browseLabel = 'Browse',
  fileName,
  defaultFileName,
  accept,
  onFileSelect,
  id,
}: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [internal, setInternal] = React.useState(defaultFileName ?? '');
  const current = fileName ?? internal;

  function open() {
    inputRef.current?.click();
  }

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (fileName === undefined) setInternal(f?.name ?? '');
          onFileSelect?.(f);
        }}
      />
      <button
        type="button"
        data-input-control=""
        onClick={open}
        disabled={disabled}
        className={cn(
          'flex h-full min-w-0 flex-1 cursor-text items-center px-3 text-left text-sm transition-colors outline-none disabled:cursor-not-allowed',
          current ? 'text-foreground' : 'text-muted-foreground/80',
          disabled && 'text-muted-foreground/60',
        )}
      >
        <span className="truncate">{current || placeholder}</span>
      </button>
      {invalid || helpTooltip != null ? (
        <TrailingSlot className="pr-2">
          <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
        </TrailingSlot>
      ) : null}
      <Divider />
      <SideAddon>
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className="inline-flex h-full items-center gap-1.5 rounded-r-[7px] bg-transparent px-3 text-sm font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {browseLabel}
        </button>
      </SideAddon>
    </InputShell>
  );
}
