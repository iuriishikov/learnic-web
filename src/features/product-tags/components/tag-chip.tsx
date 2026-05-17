'use client';

import { XIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { Tag } from '../model/types';

type TagChipProps = {
  tag: Tag;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
};

export function TagChip({ tag, onRemove, removeLabel, className }: TagChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-sm',
        className,
      )}
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      <span className="truncate">{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="-mr-1 inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <XIcon className="size-3" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
