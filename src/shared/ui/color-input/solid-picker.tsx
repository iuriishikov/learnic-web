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
  hexToHsv,
  hexToRgb,
  hsvToHex,
  normalizeHex,
  rgbToHex,
} from './lib';
import {
  AlphaSlider,
  HueSlider,
  SaturationValuePicker,
} from './pickers';
import { SavedColors, type SavedColor } from './saved-colors';
import type { HSV, SolidValue } from './types';

type Format = 'hex' | 'rgb' | 'hsv';

// Lightweight EyeDropper typing (browser API; not yet in TS DOM lib).
declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };
  }
}

const FORMAT_LABEL: Record<Format, string> = {
  hex: 'Hex',
  rgb: 'RGB',
  hsv: 'HSV',
};

const EMPTY_SUBSCRIBE = () => () => {};
const detectEyeDropper = () =>
  typeof window !== 'undefined' && typeof window.EyeDropper === 'function';
const detectEyeDropperServer = () => false;

export function SolidPicker({
  value,
  onChange,
  savedColors,
  onAddSaved,
  onPickSaved,
}: {
  value: SolidValue;
  onChange: (next: SolidValue) => void;
  savedColors?: SavedColor[];
  onAddSaved?: () => void;
  onPickSaved?: (color: SavedColor) => void;
}) {
  const [format, setFormat] = React.useState<Format>('hex');

  // Internal HSV state — necessary because hex→HSV is lossy at V=0 (any black)
  // and S=0 (any gray) where the hue collapses to 0. Without this, dragging
  // the hue slider while V=0 (or S=0) would do nothing visible.
  const [hsv, setHsvState] = React.useState<HSV>(() => hexToHsv(value.hex));

  // Sync HSV to external `value.hex` changes (saved-color pick, hex paste).
  // Preserve our hue/saturation across grayscale so the SV picker doesn't
  // snap back to red when the user dials value down to zero.
  const ourHex = hsvToHex(hsv);
  if (ourHex.toUpperCase() !== value.hex.toUpperCase()) {
    const incoming = hexToHsv(value.hex);
    setHsvState({
      h: incoming.v === 0 || incoming.s === 0 ? hsv.h : incoming.h,
      s: incoming.v === 0 ? hsv.s : incoming.s,
      v: incoming.v,
    });
  }

  const setHsv = (next: HSV) => {
    setHsvState(next);
    onChange({ ...value, hex: hsvToHex(next) });
  };

  // EyeDropper API only exists on Chromium browsers. Use useSyncExternalStore
  // with a stable server snapshot (`false`) to avoid hydration mismatch — the
  // button appears only after the client takes over.
  const hasEyeDropper = React.useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    detectEyeDropper,
    detectEyeDropperServer,
  );

  const handleEyedropper = async () => {
    if (typeof window === 'undefined' || !window.EyeDropper) return;
    try {
      const dropper = new window.EyeDropper();
      const result = await dropper.open();
      const norm = normalizeHex(result.sRGBHex);
      if (norm) onChange({ ...value, hex: norm });
    } catch {
      // User cancelled — no-op.
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <SaturationValuePicker hsv={hsv} onChange={setHsv} />

      <div className="flex items-center gap-2.5">
        {hasEyeDropper && (
          <button
            type="button"
            onClick={handleEyedropper}
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/25 focus-visible:outline-none"
            aria-label="Взять цвет с экрана"
          >
            <PipetteIcon className="size-3.5" />
          </button>
        )}
        <div className="flex flex-1 flex-col gap-2.5">
          <HueSlider hue={hsv.h} onChange={(h) => setHsv({ ...hsv, h })} />
          <AlphaSlider
            hex={value.hex}
            opacity={value.opacity}
            onChange={(opacity) => onChange({ ...value, opacity })}
          />
        </div>
      </div>

      <div className="flex items-stretch gap-2">
        <FormatMenu value={format} onChange={setFormat} />
        <ColorValueField
          format={format}
          value={value}
          hsv={hsv}
          onChange={onChange}
        />
        <OpacityField
          opacity={value.opacity}
          onCommit={(opacity) => onChange({ ...value, opacity })}
        />
      </div>

      {savedColors && (
        <SavedColors
          colors={savedColors}
          activeHex={value.hex}
          onPick={(c) => {
            onPickSaved?.(c);
            onChange({
              ...value,
              hex: c.hex,
              opacity: c.opacity ?? value.opacity,
            });
          }}
          onAdd={onAddSaved}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Format menu (Hex / RGB / HSV)

function FormatMenu({
  value,
  onChange,
}: {
  value: Format;
  onChange: (next: Format) => void;
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
            onValueChange={(v) => onChange(v as Format)}
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
// Color value text input — switches between hex / rgb / hsv display

function ColorValueField({
  format,
  value,
  hsv,
  onChange,
}: {
  format: Format;
  value: SolidValue;
  hsv: { h: number; s: number; v: number };
  onChange: (next: SolidValue) => void;
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
      className="flex-1 font-mono tracking-tight"
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
// Opacity input with trailing "%"

function OpacityField({
  opacity,
  onCommit,
}: {
  opacity: number;
  onCommit: (next: number) => void;
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
      className="w-16 text-right font-mono tabular-nums"
      trailing={
        <CompactInputAddon className="pl-0 pr-2 text-muted-foreground">
          %
        </CompactInputAddon>
      }
    />
  );
}
