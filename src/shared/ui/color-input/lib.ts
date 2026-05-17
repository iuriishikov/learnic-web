import type {
  ColorValue,
  GradientValue,
  HSV,
  ImageValue,
  RGB,
  SolidValue,
} from './types';
import { DEFAULT_IMAGE_ADJUSTMENTS } from './types';

const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);

// ──────────────────────────────────────────────────────────────────────────
// Hex parsing / formatting

const HEX_3 = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX_6 = /^#?([0-9a-f]{6})$/i;

export function normalizeHex(input: string): string | null {
  const v = input.trim();
  const m6 = v.match(HEX_6);
  if (m6) return `#${m6[1].toUpperCase()}`;
  const m3 = v.match(HEX_3);
  if (m3) {
    const [, r, g, b] = m3;
    return `#${(r + r + g + g + b + b).toUpperCase()}`;
  }
  return null;
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex) ?? '#000000';
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toByte = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0').toUpperCase();
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

// ──────────────────────────────────────────────────────────────────────────
// RGB ↔ HSV

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rN) h = ((gN - bN) / d) % 6;
    else if (max === gN) h = (bN - rN) / d + 2;
    else h = (rN - gN) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h, s, v };
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const sN = s / 100;
  const vN = v / 100;
  const c = vN * sN;
  const hh = (h % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let rN = 0;
  let gN = 0;
  let bN = 0;
  if (hh >= 0 && hh < 1) [rN, gN, bN] = [c, x, 0];
  else if (hh < 2) [rN, gN, bN] = [x, c, 0];
  else if (hh < 3) [rN, gN, bN] = [0, c, x];
  else if (hh < 4) [rN, gN, bN] = [0, x, c];
  else if (hh < 5) [rN, gN, bN] = [x, 0, c];
  else [rN, gN, bN] = [c, 0, x];
  const m = vN - c;
  return {
    r: Math.round((rN + m) * 255),
    g: Math.round((gN + m) * 255),
    b: Math.round((bN + m) * 255),
  };
}

export function hexToHsv(hex: string): HSV {
  return rgbToHsv(hexToRgb(hex));
}

export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv));
}

// ──────────────────────────────────────────────────────────────────────────
// Rendering helpers

export function hexAlphaToRgba(hex: string, opacityPct: number): string {
  const { r, g, b } = hexToRgb(hex);
  const a = clamp(opacityPct, 0, 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function hexWithAlpha(hex: string, opacityPct: number): string {
  const norm = normalizeHex(hex) ?? '#000000';
  const a = Math.round(clamp(opacityPct, 0, 100) * 2.55)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return opacityPct >= 100 ? norm : `${norm}${a}`;
}

export function gradientToCss(g: GradientValue): string {
  const stops = [...g.stops]
    .sort((a, b) => a.position - b.position)
    .map((s) => `${hexAlphaToRgba(s.hex, s.opacity)} ${s.position}%`)
    .join(', ');
  if (g.type === 'radial') return `radial-gradient(circle, ${stops})`;
  return `linear-gradient(${g.angle}deg, ${stops})`;
}

export function imageToCss(img: ImageValue): string {
  if (!img.src) return 'transparent';
  return `url(${JSON.stringify(img.src)})`;
}

export function colorToCss(v: ColorValue): string {
  if (v.kind === 'solid') return hexAlphaToRgba(v.hex, v.opacity);
  if (v.kind === 'gradient') return gradientToCss(v);
  return imageToCss(v);
}

export function previewDisplay(v: ColorValue): string {
  if (v.kind === 'solid') return v.hex.replace(/^#/, '');
  if (v.kind === 'gradient') return 'Gradient';
  return v.src ? 'Image' : 'No image';
}

// ──────────────────────────────────────────────────────────────────────────
// Constructors / defaults

export function solid(hex: string, opacity = 100): SolidValue {
  return {
    kind: 'solid',
    hex: normalizeHex(hex) ?? '#000000',
    opacity: clamp(opacity, 0, 100),
  };
}

export function linearGradient(
  stops: { hex: string; position: number; opacity?: number }[],
  angle = 90,
): GradientValue {
  return {
    kind: 'gradient',
    type: 'linear',
    angle,
    stops: stops.map((s, i) => ({
      id: `${i}-${s.position}`,
      position: s.position,
      hex: normalizeHex(s.hex) ?? '#000000',
      opacity: s.opacity ?? 100,
    })),
  };
}

export function emptyImage(): ImageValue {
  return {
    kind: 'image',
    src: '',
    fit: 'cover',
    adjustments: { ...DEFAULT_IMAGE_ADJUSTMENTS },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Misc

export { clamp };
