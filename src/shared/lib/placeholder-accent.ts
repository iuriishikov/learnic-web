/**
 * Deterministic visual variants for the soft (non-brand) background placeholder
 * and the brand SVG library. A given seed string always maps to the same
 * accent / brand image across renders and processes.
 */

export type SoftAccent =
  | 'pink'
  | 'green'
  | 'amber'
  | 'sky'
  | 'violet'
  | 'lilac';

type AccentTheme = {
  /** Tinted wash that fills the cover behind the blob. */
  tint: string;
  /** Vivid pastel used as the blob core (radial-gradient start). */
  blob: string;
};

export const SOFT_ACCENTS: Record<SoftAccent, AccentTheme> = {
  pink: { tint: 'oklch(0.97 0.02 25)', blob: 'oklch(0.86 0.09 18)' },
  green: { tint: 'oklch(0.96 0.02 165)', blob: 'oklch(0.85 0.1 152)' },
  amber: { tint: 'oklch(0.97 0.03 85)', blob: 'oklch(0.88 0.11 80)' },
  sky: { tint: 'oklch(0.96 0.02 230)', blob: 'oklch(0.85 0.08 230)' },
  violet: { tint: 'oklch(0.97 0.02 295)', blob: 'oklch(0.84 0.09 295)' },
  lilac: { tint: 'oklch(0.97 0.02 320)', blob: 'oklch(0.86 0.08 320)' },
};

const SOFT_ACCENT_ORDER: SoftAccent[] = [
  'pink',
  'green',
  'amber',
  'sky',
  'violet',
  'lilac',
];

export const BRAND_PLACEHOLDERS = [
  '/placeholders/01-aurora.svg',
  '/placeholders/02-prism-fade.svg',
  '/placeholders/03-heatmap.svg',
  '/placeholders/04-liquid-chrome.svg',
  '/placeholders/05-dreamy-blur.svg',
  '/placeholders/06-film-grain.svg',
  '/placeholders/07-dynamic-mesh.svg',
] as const;

export type BrandPlaceholderSrc = (typeof BRAND_PLACEHOLDERS)[number];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function softAccentFromSeed(seed: string): SoftAccent {
  return SOFT_ACCENT_ORDER[hashSeed(seed) % SOFT_ACCENT_ORDER.length];
}

export function brandPlaceholderFromSeed(seed: string): BrandPlaceholderSrc {
  return BRAND_PLACEHOLDERS[hashSeed(seed) % BRAND_PLACEHOLDERS.length];
}

export function softCoverGradient(accent: SoftAccent): string {
  const { blob, tint } = SOFT_ACCENTS[accent];
  return `radial-gradient(60% 70% at 50% 45%, ${blob} 0%, ${tint} 70%, ${tint} 100%)`;
}
