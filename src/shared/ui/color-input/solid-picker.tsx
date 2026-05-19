'use client';

import * as React from 'react';

import { hexToHsv, hsvToHex } from './lib';
import {
  ColorValueInput,
  EyedropperButton,
  FormatMenu,
  OpacityInput,
  useEyeDropperAvailable,
  type ColorFormat,
} from './inputs';
import {
  AlphaSlider,
  HueSlider,
  SaturationValuePicker,
} from './pickers';
import { SavedColors, type SavedColor } from './saved-colors';
import type { HSV, SolidValue } from './types';

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
  const [format, setFormat] = React.useState<ColorFormat>('hex');

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

  const hasEyeDropper = useEyeDropperAvailable();

  return (
    <div className="flex flex-col gap-3">
      <SaturationValuePicker hsv={hsv} onChange={setHsv} />

      <div className="flex items-center gap-2.5">
        {hasEyeDropper && (
          <EyedropperButton
            onPick={(hex) => onChange({ ...value, hex })}
          />
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
        <ColorValueInput
          format={format}
          value={value}
          hsv={hsv}
          onChange={onChange}
        />
        <OpacityInput
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
