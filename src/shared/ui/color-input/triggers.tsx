'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { PopoverTrigger } from '@/shared/ui/popover';

import { colorToCss, previewDisplay } from './lib';
import { CHECKER_BG } from './pickers';
import type { ColorValue } from './types';

// Set to `true` by ColorInput when its children render. When `false` (the
// default), trigger components render as plain styled buttons — useful for
// previewing states (`forceFocus` / `disabled`) outside an open popover.
export const InsideColorInputContext = React.createContext(false);

type TriggerElProps = React.ComponentProps<'button'> & {
  'data-color-trigger'?: string;
  'data-focused'?: string;
};

function TriggerEl({
  asPlainButton,
  ...props
}: TriggerElProps & { asPlainButton?: boolean }) {
  if (asPlainButton) {
    return <button type="button" {...props} />;
  }
  return <PopoverTrigger {...props} />;
}

function useInsidePopover(): boolean {
  return React.useContext(InsideColorInputContext);
}

// ──────────────────────────────────────────────────────────────────────────
// Shared swatch chip (renders the current value as a colored circle).

function Swatch({
  value,
  size,
}: {
  value: ColorValue;
  size: number;
}) {
  return (
    <span
      aria-hidden
      className="relative inline-block shrink-0 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
      style={{ width: size, height: size, background: CHECKER_BG }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{ background: colorToCss(value) }}
      />
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Common trigger props

type CommonProps = {
  value: ColorValue;
  /** Renders the trigger as visually focused/open (preview use). */
  forceFocus?: boolean;
  disabled?: boolean;
  className?: string;
};

// ──────────────────────────────────────────────────────────────────────────
// 1) Swatch — just the circle (sm / md / lg)

export type ColorSwatchTriggerProps = CommonProps & {
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
};

const SWATCH_PX: Record<NonNullable<ColorSwatchTriggerProps['size']>, number> = {
  sm: 18,
  md: 28,
  lg: 36,
};

export function ColorSwatchTrigger({
  value,
  size = 'md',
  forceFocus,
  disabled,
  className,
  ariaLabel = 'Выбрать цвет',
}: ColorSwatchTriggerProps) {
  const px = SWATCH_PX[size];
  const insidePopover = useInsidePopover();
  return (
    <TriggerEl
      asPlainButton={!insidePopover}
      data-color-trigger="swatch"
      data-focused={forceFocus ? 'true' : undefined}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'group inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full p-0.5 outline-none transition-shadow',
        'focus-visible:ring-3 focus-visible:ring-brand/30 data-popup-open:ring-3 data-popup-open:ring-brand/30',
        'data-[focused=true]:ring-3 data-[focused=true]:ring-brand/30',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <Swatch value={value} size={px} />
    </TriggerEl>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 2) Pill with hex + opacity — bordered pill: dot + "7F56D9" + "100%"

export type ColorPillTriggerProps = CommonProps & {
  size?: 'sm' | 'md';
  hideOpacity?: boolean;
};

export function ColorPillTrigger({
  value,
  size = 'sm',
  hideOpacity,
  forceFocus,
  disabled,
  className,
}: ColorPillTriggerProps) {
  const sizeCls =
    size === 'md'
      ? 'h-9 gap-2 px-2.5 text-sm'
      : 'h-7 gap-1.5 px-1.5 text-xs';
  const swatchPx = size === 'md' ? 18 : 14;
  const showOpacity =
    !hideOpacity && value.kind === 'solid' && value.opacity < 100;
  const opacityText =
    value.kind === 'solid' ? `${Math.round(value.opacity)}%` : null;
  const insidePopover = useInsidePopover();

  return (
    <TriggerEl
      asPlainButton={!insidePopover}
      data-color-trigger="pill"
      data-focused={forceFocus ? 'true' : undefined}
      disabled={disabled}
      className={cn(
        'group inline-flex cursor-pointer items-center rounded-full border border-input bg-transparent text-foreground outline-none transition-all',
        'hover:bg-muted/40',
        'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/25',
        'data-[focused=true]:border-brand data-[focused=true]:ring-3 data-[focused=true]:ring-brand/25',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeCls,
        className,
      )}
    >
      <Swatch value={value} size={swatchPx} />
      <span className="font-mono tabular-nums tracking-tight">
        {previewDisplay(value)}
      </span>
      {(showOpacity || value.kind === 'solid') && opacityText && (
        <span className="font-mono tabular-nums text-muted-foreground">
          {opacityText}
        </span>
      )}
    </TriggerEl>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 3) Labeled chevron — pill with custom text + chevron ("Color ▾")

export type ColorLabelTriggerProps = CommonProps & {
  label?: React.ReactNode;
  size?: 'sm' | 'md';
};

export function ColorLabelTrigger({
  value,
  label = 'Color',
  size = 'sm',
  forceFocus,
  disabled,
  className,
}: ColorLabelTriggerProps) {
  const sizeCls =
    size === 'md'
      ? 'h-9 gap-2 px-2.5 text-sm'
      : 'h-7 gap-1.5 px-1.5 text-xs';
  const swatchPx = size === 'md' ? 18 : 14;
  const insidePopover = useInsidePopover();
  return (
    <TriggerEl
      asPlainButton={!insidePopover}
      data-color-trigger="labeled"
      data-focused={forceFocus ? 'true' : undefined}
      disabled={disabled}
      className={cn(
        'group inline-flex cursor-pointer items-center rounded-full border border-input bg-transparent text-foreground outline-none transition-all',
        'hover:bg-muted/40',
        'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/25',
        'data-[focused=true]:border-brand data-[focused=true]:ring-3 data-[focused=true]:ring-brand/25',
        'disabled:pointer-events-none disabled:opacity-50',
        sizeCls,
        className,
      )}
    >
      <Swatch value={value} size={swatchPx} />
      <span className="font-medium">{label}</span>
      <ChevronDownIcon
        aria-hidden
        className={cn(
          'size-3.5 text-muted-foreground transition-transform',
          'group-data-popup-open:rotate-180',
        )}
      />
    </TriggerEl>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 4) Full row field — Input-like with leading swatch + hex + chevron

export type ColorFieldTriggerProps = CommonProps & {
  placeholder?: string;
  size?: 'sm' | 'md';
};

export function ColorFieldTrigger({
  value,
  placeholder,
  size = 'md',
  forceFocus,
  disabled,
  className,
}: ColorFieldTriggerProps) {
  const hCls = size === 'sm' ? 'h-9' : 'h-10';
  const insidePopover = useInsidePopover();
  return (
    <TriggerEl
      asPlainButton={!insidePopover}
      data-color-trigger="field"
      data-focused={forceFocus ? 'true' : undefined}
      disabled={disabled}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm text-foreground shadow-xs outline-none transition-all',
        'hover:bg-muted/30',
        'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25',
        'data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/25',
        'data-[focused=true]:border-brand data-[focused=true]:ring-3 data-[focused=true]:ring-brand/25',
        'disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60',
        hCls,
        className,
      )}
    >
      <Swatch value={value} size={18} />
      <span className="flex-1 truncate font-mono tabular-nums tracking-tight">
        {value.kind === 'solid'
          ? value.hex
          : (previewDisplay(value) || placeholder)}
      </span>
      <ChevronDownIcon
        aria-hidden
        className={cn(
          'size-4 text-muted-foreground transition-transform',
          'group-data-popup-open:rotate-180',
        )}
      />
    </TriggerEl>
  );
}
