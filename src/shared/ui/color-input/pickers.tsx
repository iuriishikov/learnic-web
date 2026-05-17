'use client';

import * as React from 'react';
import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from '@/shared/lib/utils';

import { clamp, hsvToHex } from './lib';
import type { HSV } from './types';

// ──────────────────────────────────────────────────────────────────────────
// Proper transparent-checker background (repeating 8px squares).
// `conic-gradient` doesn't repeat on its own — use `repeating-conic-gradient`.

export const CHECKER_BG =
  'repeating-conic-gradient(rgb(232 232 235) 0% 25%, rgb(255 255 255) 0% 50%) 50% / 12px 12px';

// ──────────────────────────────────────────────────────────────────────────
// 2D Saturation × Value picker (custom pointer math — no base-ui equivalent)

type DragBinding = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onPointerDown: (ev: React.PointerEvent) => void;
  onPointerMove: (ev: React.PointerEvent) => void;
  onPointerUp: (ev: React.PointerEvent) => void;
};

function usePointerDrag(
  handler: (pct: { x: number; y: number }) => void,
): DragBinding {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const dragging = React.useRef(false);

  const compute = React.useCallback(
    (ev: PointerEvent | React.PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
      handler({ x, y });
    },
    [handler],
  );

  const onPointerDown = (ev: React.PointerEvent) => {
    ev.preventDefault();
    dragging.current = true;
    containerRef.current?.setPointerCapture(ev.pointerId);
    compute(ev);
  };
  const onPointerMove = (ev: React.PointerEvent) => {
    if (!dragging.current) return;
    compute(ev);
  };
  const onPointerUp = (ev: React.PointerEvent) => {
    dragging.current = false;
    containerRef.current?.releasePointerCapture(ev.pointerId);
  };

  return { containerRef, onPointerDown, onPointerMove, onPointerUp };
}

export function SaturationValuePicker({
  hsv,
  onChange,
  className,
}: {
  hsv: HSV;
  onChange: (next: HSV) => void;
  className?: string;
}) {
  const { containerRef, onPointerDown, onPointerMove, onPointerUp } =
    usePointerDrag(({ x, y }) => {
      onChange({ h: hsv.h, s: x * 100, v: (1 - y) * 100 });
    });

  const baseHex = hsvToHex({ h: hsv.h, s: 100, v: 100 });
  const xPct = clamp(hsv.s, 0, 100);
  const yPct = clamp(100 - hsv.v, 0, 100);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        'relative aspect-square w-full cursor-crosshair touch-none select-none',
        className,
      )}
      role="application"
      aria-label={`Saturation ${Math.round(hsv.s)}, Value ${Math.round(hsv.v)}`}
      tabIndex={0}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 10 : 2;
        if (e.key === 'ArrowLeft') onChange({ ...hsv, s: clamp(hsv.s - step, 0, 100) });
        else if (e.key === 'ArrowRight') onChange({ ...hsv, s: clamp(hsv.s + step, 0, 100) });
        else if (e.key === 'ArrowUp') onChange({ ...hsv, v: clamp(hsv.v + step, 0, 100) });
        else if (e.key === 'ArrowDown') onChange({ ...hsv, v: clamp(hsv.v - step, 0, 100) });
        else return;
        e.preventDefault();
      }}
    >
      {/* Painted layers live inside an overflow-hidden child so the rounded
          corners clip them cleanly. The thumb sits as a sibling so its
          translate at 0%/100% positions isn't half-clipped at the edges. */}
      <div
        aria-hidden
        className="absolute inset-0 overflow-hidden rounded-lg shadow-inner ring-1 ring-foreground/10"
        style={{ backgroundColor: baseHex }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 0%, rgba(255,255,255,0) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to top, #000 0%, rgba(0,0,0,0) 100%)',
          }}
        />
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.45)]"
        style={{ left: `${xPct}%`, top: `${yPct}%` }}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Linear 1D slider built on base-ui Slider — used for hue and alpha.

type LinearSliderProps = {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Thumb fill color (matches the current selection). */
  thumbColor: string;
  ariaLabel: string;
  className?: string;
};

function LinearColorSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  trackBackground,
  thumbColor,
  ariaLabel,
  className,
}: LinearSliderProps & { trackBackground: string }) {
  return (
    <SliderPrimitive.Root
      value={value}
      min={min}
      max={max}
      step={step}
      thumbAlignment="center"
      onValueChange={(next) => {
        const n = Array.isArray(next) ? next[0] : next;
        if (typeof n === 'number') onChange(clamp(n, min, max));
      }}
      className={cn('relative w-full select-none', className)}
    >
      <SliderPrimitive.Control className="relative flex h-4 w-full touch-none items-center select-none">
        <SliderPrimitive.Track
          className="relative h-3 grow overflow-hidden rounded-full ring-1 ring-foreground/10"
          style={{ background: trackBackground }}
        >
          <SliderPrimitive.Indicator className="invisible" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={ariaLabel}
          className="relative block size-4 shrink-0 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.4)] outline-none transition-[box-shadow] focus-visible:ring-3 focus-visible:ring-brand/35"
          style={{ backgroundColor: thumbColor }}
        />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

const HUE_GRADIENT =
  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)';

export function HueSlider({
  hue,
  onChange,
  className,
}: {
  hue: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  return (
    <LinearColorSlider
      value={hue}
      onChange={onChange}
      min={0}
      max={360}
      step={1}
      ariaLabel="Hue"
      thumbColor={hsvToHex({ h: hue, s: 100, v: 100 })}
      trackBackground={HUE_GRADIENT}
      className={className}
    />
  );
}

export function AlphaSlider({
  hex,
  opacity,
  onChange,
  className,
}: {
  hex: string;
  opacity: number;
  onChange: (next: number) => void;
  className?: string;
}) {
  // Layer the alpha ramp on top of the transparent-checker background — no
  // extra wrapper element (which would clip the thumb at the slider edges).
  return (
    <LinearColorSlider
      value={opacity}
      onChange={onChange}
      min={0}
      max={100}
      step={1}
      ariaLabel="Opacity"
      thumbColor={hex}
      trackBackground={`linear-gradient(to right, rgba(0,0,0,0) 0%, ${hex} 100%), ${CHECKER_BG}`}
      className={className}
    />
  );
}
