'use client';

import * as React from 'react';
import { PlusIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import { CHECKER_BG } from './pickers';
import { hexAlphaToRgba } from './lib';

export type SavedColor = {
  id: string;
  hex: string;
  /** Optional opacity (0..100). Defaults to 100. */
  opacity?: number;
};

export function SavedColors({
  colors,
  activeHex,
  onPick,
  onAdd,
  label = 'Сохранённые',
  addLabel = 'Добавить',
}: {
  colors: SavedColor[];
  /** Active hex used to highlight the matching swatch. */
  activeHex?: string;
  onPick: (color: SavedColor) => void;
  onAdd?: () => void;
  label?: string;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-border/60 pt-3">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        <span>{label}</span>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
          >
            <PlusIcon className="size-3" />
            {addLabel}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {colors.map((c) => {
          const active =
            activeHex != null && c.hex.toUpperCase() === activeHex.toUpperCase();
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c)}
              aria-pressed={active || undefined}
              className={cn(
                'relative inline-flex size-5 cursor-pointer items-center justify-center rounded-full ring-1 ring-foreground/10 transition-[box-shadow,transform] focus-visible:outline-none',
                active
                  ? 'ring-2 ring-brand ring-offset-2 ring-offset-popover'
                  : 'hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-popover',
              )}
              style={{ background: CHECKER_BG }}
              aria-label={`${c.hex}${c.opacity != null && c.opacity < 100 ? ` ${Math.round(c.opacity)}%` : ''}`}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: hexAlphaToRgba(c.hex, c.opacity ?? 100),
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
