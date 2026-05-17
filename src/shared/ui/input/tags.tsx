'use client';

import * as React from 'react';
import { XIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';

import type { CommonInputProps } from './common';
import { InputShell, SwapIndicator, TrailingSlot } from './shell';

type TagsInputProps = CommonInputProps & {
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  removeLabel?: string;
};

// Free-text input that commits each entry to a chip on `Enter` / `,`.
// `Backspace` on an empty draft removes the last chip. Tags-array is
// either controlled (`values`) or uncontrolled (`defaultValues`).
export function TagsInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  values,
  defaultValues = [],
  onValuesChange,
  placeholder = 'Add tag',
  removeLabel = 'Remove',
}: TagsInputProps) {
  const [internal, setInternal] = React.useState<string[]>(defaultValues);
  const items = values ?? internal;
  const [draft, setDraft] = React.useState('');
  const reduce = useReducedMotion();

  function setItems(next: string[]) {
    if (values === undefined) setInternal(next);
    onValuesChange?.(next);
  }

  function commit() {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) {
      setDraft('');
      return;
    }
    setItems([...items, v]);
    setDraft('');
  }

  function removeAt(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  }

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={cn('min-h-10 h-auto flex-wrap py-1.5 pl-2 pr-2', className)}
    >
      <div className="flex w-full flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.span
              key={item + i}
              initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-input bg-background pl-2 pr-1 text-xs font-medium text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`${removeLabel} ${item}`}
                className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed [&_svg]:size-3"
              >
                <XIcon />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          data-input-control=""
          type="text"
          value={draft}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && items.length) {
              removeAt(items.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={items.length === 0 ? placeholder : ''}
          className="h-7 min-w-[6ch] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
        />
      </div>
      <TrailingSlot className="self-start py-1">
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}
