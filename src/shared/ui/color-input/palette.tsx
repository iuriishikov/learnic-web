'use client';

import * as React from 'react';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';

import { hexAlphaToRgba } from './lib';
import { CHECKER_BG } from './pickers';
import { type SavedColor } from './saved-colors';

// `Palette` is the configurable swatch-grid component that covers every
// variant from the design reference: a plain custom grid (no header), a
// titled palette with subtitle + Docs/Reset footer (Brand / Gray), and a
// dropdown-titled palette with "+ Add" (Saved).
//
// The component is intentionally compositional — pass only the slots you
// need. SolidPicker still uses the older `SavedColors` API (kept for the
// existing popover); new compositions should reach for `Palette`.

export type PaletteOption = { value: string; label: React.ReactNode };

export type PaletteAction = {
  label: React.ReactNode;
  onClick?: () => void;
  href?: string;
};

export type PaletteProps = {
  /** Plain text title — exclusive with `titleDropdown`. */
  title?: React.ReactNode;
  /** Title rendered as a dropdown menu (e.g., "Saved ▾"). */
  titleDropdown?: {
    value: string;
    options: PaletteOption[];
    onChange: (next: string) => void;
    /** Aria label for the dropdown trigger. */
    ariaLabel?: string;
  };
  /** Optional right-aligned subtitle near the title (e.g., "Tailwind CSS v4.2"). */
  subtitle?: React.ReactNode;
  /** "+ Add" action; renders only when provided. */
  onAdd?: () => void;
  addLabel?: React.ReactNode;
  colors: SavedColor[];
  /** Highlight the swatch that matches this hex. */
  activeHex?: string;
  onPick: (color: SavedColor) => void;
  /** Optional footer split — primary left, secondary right. */
  primaryAction?: PaletteAction;
  secondaryAction?: PaletteAction;
  /** Override outer container styling. */
  className?: string;
  /** Override swatch row styling (e.g., narrower gap). */
  swatchesClassName?: string;
};

export function Palette({
  title,
  titleDropdown,
  subtitle,
  onAdd,
  addLabel = 'Добавить',
  colors,
  activeHex,
  onPick,
  primaryAction,
  secondaryAction,
  className,
  swatchesClassName,
}: PaletteProps) {
  const hasHeader = title != null || titleDropdown != null || subtitle != null || onAdd != null;
  const hasFooter = primaryAction != null || secondaryAction != null;
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-xs',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {titleDropdown ? (
              <PaletteDropdownTitle {...titleDropdown} />
            ) : (
              title != null && (
                <span className="text-sm font-medium text-foreground">
                  {title}
                </span>
              )
            )}
            {subtitle != null && (
              <span className="truncate text-xs text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none"
            >
              <PlusIcon className="size-3" />
              {addLabel}
            </button>
          )}
        </div>
      )}

      <PaletteSwatches
        colors={colors}
        activeHex={activeHex}
        onPick={onPick}
        className={swatchesClassName}
      />

      {hasFooter && (
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
          <FooterAction action={primaryAction} />
          <FooterAction action={secondaryAction} />
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Swatch grid — exported separately so callers can render their own header.

export function PaletteSwatches({
  colors,
  activeHex,
  onPick,
  className,
  size = 'md',
}: {
  colors: SavedColor[];
  activeHex?: string;
  onPick: (color: SavedColor) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const swatchSize = size === 'sm' ? 'size-4' : 'size-5';
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
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
              'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 ring-foreground/10 transition-[box-shadow,transform] focus-visible:outline-none',
              swatchSize,
              active
                ? 'ring-2 ring-brand ring-offset-2 ring-offset-card'
                : 'hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-card',
            )}
            style={{ background: CHECKER_BG }}
            aria-label={`${c.hex}${
              c.opacity != null && c.opacity < 100
                ? ` ${Math.round(c.opacity)}%`
                : ''
            }`}
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
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Internal: dropdown-as-title

function PaletteDropdownTitle({
  value,
  options,
  onChange,
  ariaLabel = 'Выбрать палитру',
}: NonNullable<PaletteProps['titleDropdown']>) {
  const current = options.find((o) => o.value === value);
  return (
    <Menu>
      <MenuTrigger
        className={cn(
          'inline-flex cursor-pointer items-center gap-1 rounded-md text-sm font-medium text-foreground outline-none transition-colors',
          'hover:text-foreground/80',
          'focus-visible:outline-none data-popup-open:text-foreground/80',
        )}
        aria-label={ariaLabel}
      >
        {current?.label ?? value}
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent size="sm" align="start" className="min-w-[8rem]">
        <MenuGroup>
          <MenuRadioGroup value={value} onValueChange={onChange}>
            {options.map((o) => (
              <MenuRadioItem key={o.value} value={o.value}>
                {o.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Internal: footer action (link or button)

function FooterAction({ action }: { action?: PaletteAction }) {
  if (!action) return <span aria-hidden />;
  const cls =
    'inline-flex cursor-pointer items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none';
  if (action.href) {
    return (
      <a href={action.href} className={cls} target="_blank" rel="noreferrer">
        {action.label}
      </a>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={cls}>
      {action.label}
    </button>
  );
}
