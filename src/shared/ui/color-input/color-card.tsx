'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import { colorToCss, hexToRgb } from './lib';
import { CHECKER_BG } from './pickers';
import type { ColorValue } from './types';

// Big rectangular color preview card (the "# 7F56D9" purple block at the
// top of the right column in the reference). Renders the current value as
// a solid / gradient / image fill with a hex caption centered on top. Uses
// the perceived luminance of the underlying color to pick a readable text
// color so the caption stays legible on any background.

export function ColorCard({
  value,
  className,
  height = 96,
  caption,
}: {
  value: ColorValue;
  className?: string;
  height?: number;
  /** Override the auto-derived caption (default: hex / "Gradient" / "Image"). */
  caption?: React.ReactNode;
}) {
  const captionText = caption ?? deriveCaption(value);
  const readableTextClass = value.kind === 'solid'
    ? isDarkColor(value.hex, value.opacity)
      ? 'text-white'
      : 'text-foreground'
    : 'text-white';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-xl ring-1 ring-foreground/10 shadow-inner',
        className,
      )}
      style={{ height, background: CHECKER_BG }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: colorToCss(value) }}
      />
      <span
        className={cn(
          'relative font-mono text-base font-semibold tracking-tight drop-shadow-sm',
          readableTextClass,
        )}
      >
        {captionText}
      </span>
    </div>
  );
}

function deriveCaption(value: ColorValue): string {
  if (value.kind === 'solid') return `# ${value.hex.replace(/^#/, '')}`;
  if (value.kind === 'gradient') return 'Gradient';
  return value.src ? 'Image' : 'No image';
}

function isDarkColor(hex: string, opacity: number): boolean {
  // Compose the color onto a white backdrop so very transparent colors
  // (which sit on the checker pattern → effectively white-ish) are
  // classified relative to what users actually see.
  const { r, g, b } = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, opacity / 100));
  const composedR = r * a + 255 * (1 - a);
  const composedG = g * a + 255 * (1 - a);
  const composedB = b * a + 255 * (1 - a);
  // Standard relative-luminance approximation.
  const luminance =
    (0.2126 * composedR + 0.7152 * composedG + 0.0722 * composedB) / 255;
  return luminance < 0.6;
}
