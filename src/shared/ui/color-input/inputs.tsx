'use client';

import * as React from 'react';
import { ChevronDownIcon, PipetteIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';

import { CompactInput, CompactInputAddon } from './compact-input';
import {
  clamp,
  hexAlphaToRgba,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  rgbToHex,
} from './lib';
import type { HSV, SolidValue } from './types';

// Browser EyeDropper feature detection (Chromium only at the moment).
declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };
  }
}

const EMPTY_SUBSCRIBE = () => () => {};
const detectEyeDropper = () =>
  typeof window !== 'undefined' && typeof window.EyeDropper === 'function';
const detectEyeDropperServer = () => false;

export function useEyeDropperAvailable(): boolean {
  return React.useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    detectEyeDropper,
    detectEyeDropperServer,
  );
}

export function EyedropperButton({
  onPick,
  className,
}: {
  onPick: (hex: string) => void;
  className?: string;
}) {
  const handle = async () => {
    if (typeof window === 'undefined' || !window.EyeDropper) return;
    try {
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      const norm = normalizeHex(result.sRGBHex);
      if (norm) onPick(norm);
    } catch {
      // User cancelled — no-op.
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        'inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 focus-visible:outline-none',
        className,
      )}
      aria-label="Взять цвет с экрана"
    >
      <PipetteIcon className="size-3.5" />
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Format menu (Hex / RGB / HSV)

export type ColorFormat = 'hex' | 'rgb' | 'hsv';

const FORMAT_LABEL: Record<ColorFormat, string> = {
  hex: 'Hex',
  rgb: 'RGB',
  hsv: 'HSV',
};

export function FormatMenu({
  value,
  onChange,
}: {
  value: ColorFormat;
  onChange: (next: ColorFormat) => void;
}) {
  return (
    <Menu>
      <MenuTrigger
        className={cn(
          'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-input bg-transparent px-2 text-xs font-medium text-foreground shadow-xs outline-none transition-colors',
          'hover:bg-muted/50',
          'focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/25',
        )}
        aria-label="Формат цвета"
      >
        {FORMAT_LABEL[value]}
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent size="sm" align="start" className="min-w-[8rem]">
        <MenuGroup>
          <MenuRadioGroup
            value={value}
            onValueChange={(v) => onChange(v as ColorFormat)}
          >
            <MenuRadioItem value="hex">Hex</MenuRadioItem>
            <MenuRadioItem value="rgb">RGB</MenuRadioItem>
            <MenuRadioItem value="hsv">HSV</MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Hex input with leading swatch dot. Reuses CompactInput from the existing
// color popover so visual language stays consistent.

export function HexInput({
  hex,
  opacity = 100,
  onCommit,
  className,
  shellClassName,
  showSwatch = true,
  spellCheck = false,
}: {
  hex: string;
  opacity?: number;
  onCommit: (hex: string) => void;
  className?: string;
  shellClassName?: string;
  showSwatch?: boolean;
  spellCheck?: boolean;
}) {
  const display = hex.replace(/^#/, '');
  const [draft, setDraft] = React.useState(display);
  const [prev, setPrev] = React.useState(display);
  if (prev !== display) {
    setPrev(display);
    setDraft(display);
  }

  const commit = () => {
    const norm = normalizeHex(draft);
    if (norm) onCommit(norm);
    else setDraft(display);
  };

  return (
    <CompactInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      spellCheck={spellCheck}
      shellClassName={shellClassName}
      className={cn('flex-1 font-mono tracking-tight', className)}
      leading={
        showSwatch ? (
          <CompactInputAddon>
            <span
              aria-hidden
              className="inline-block size-3.5 shrink-0 rounded-full ring-1 ring-foreground/15"
              style={{ backgroundColor: hexAlphaToRgba(hex, opacity) }}
            />
          </CompactInputAddon>
        ) : undefined
      }
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Format-aware color value input — supports hex / rgb / hsv display.

export function ColorValueInput({
  format,
  value,
  hsv,
  onChange,
  className,
  shellClassName,
}: {
  format: ColorFormat;
  value: SolidValue;
  hsv: HSV;
  onChange: (next: SolidValue) => void;
  className?: string;
  shellClassName?: string;
}) {
  const rgb = hexToRgb(value.hex);
  const displayValue =
    format === 'hex'
      ? value.hex.replace(/^#/, '')
      : format === 'rgb'
        ? `${rgb.r}, ${rgb.g}, ${rgb.b}`
        : `${Math.round(hsv.h)}, ${Math.round(hsv.s)}%, ${Math.round(hsv.v)}%`;

  const [draft, setDraft] = React.useState(displayValue);
  const [prevDisplay, setPrevDisplay] = React.useState(displayValue);
  if (prevDisplay !== displayValue) {
    setPrevDisplay(displayValue);
    setDraft(displayValue);
  }

  const commit = () => {
    if (format === 'hex') {
      const norm = normalizeHex(draft);
      if (norm) onChange({ ...value, hex: norm });
      else setDraft(displayValue);
      return;
    }
    const parts = draft
      .split(/[,\s]+/)
      .map((p) => parseFloat(p.replace('%', '')))
      .filter((n) => !Number.isNaN(n));
    if (format === 'rgb' && parts.length === 3) {
      onChange({
        ...value,
        hex: rgbToHex({
          r: clamp(parts[0], 0, 255),
          g: clamp(parts[1], 0, 255),
          b: clamp(parts[2], 0, 255),
        }),
      });
    } else if (format === 'hsv' && parts.length === 3) {
      onChange({
        ...value,
        hex: hsvToHex({
          h: clamp(parts[0], 0, 360),
          s: clamp(parts[1], 0, 100),
          v: clamp(parts[2], 0, 100),
        }),
      });
    } else {
      setDraft(displayValue);
    }
  };

  return (
    <CompactInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      spellCheck={false}
      shellClassName={shellClassName}
      className={cn('flex-1 font-mono tracking-tight', className)}
      leading={
        <CompactInputAddon>
          <span
            aria-hidden
            className="inline-block size-3.5 shrink-0 rounded-full ring-1 ring-foreground/15"
            style={{ backgroundColor: value.hex }}
          />
        </CompactInputAddon>
      }
    />
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Opacity input with trailing "%".

export function OpacityInput({
  opacity,
  onCommit,
  className,
  shellClassName,
}: {
  opacity: number;
  onCommit: (next: number) => void;
  className?: string;
  shellClassName?: string;
}) {
  const rounded = Math.round(opacity);
  const [draft, setDraft] = React.useState(`${rounded}`);
  const [prevRounded, setPrevRounded] = React.useState(rounded);
  if (prevRounded !== rounded) {
    setPrevRounded(rounded);
    setDraft(`${rounded}`);
  }

  const commit = () => {
    const parsed = parseFloat(draft.replace('%', ''));
    if (Number.isNaN(parsed)) {
      setDraft(`${rounded}`);
      return;
    }
    onCommit(clamp(parsed, 0, 100));
  };

  return (
    <CompactInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      inputMode="numeric"
      spellCheck={false}
      shellClassName={shellClassName}
      className={cn('w-16 text-right font-mono tabular-nums', className)}
      trailing={
        <CompactInputAddon className="pl-0 pr-2 text-muted-foreground">
          %
        </CompactInputAddon>
      }
    />
  );
}
