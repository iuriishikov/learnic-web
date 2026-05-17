/**
 * Shared constants for the rich-editor package.
 *
 * Everything here is **data**: font option catalog, color swatches,
 * the inverse-toggle Tailwind classes used by both the toolbar and
 * the bubble menu. Splitting these out of the toolbar files lets each
 * file stay focused on one tool without dragging the whole color
 * palette and font list along with it.
 */

export type FontOptionId = 'inter' | 'system' | 'serif' | 'mono';

export type FontOption = {
  id: FontOptionId;
  /** Value stored in the editor as the inline `font-family`. */
  cssValue: string;
  /** Family used to render the option's preview in the dropdown trigger. */
  previewFamily: string;
};

export const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: 'inter',
    cssValue: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif',
    previewFamily: 'var(--font-inter), Inter, sans-serif',
  },
  {
    id: 'system',
    cssValue:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    previewFamily: 'system-ui, -apple-system, sans-serif',
  },
  {
    id: 'serif',
    cssValue: 'Georgia, "Times New Roman", serif',
    previewFamily: 'Georgia, serif',
  },
  {
    id: 'mono',
    cssValue: 'var(--font-geist-mono), ui-monospace, monospace',
    previewFamily: 'var(--font-geist-mono), monospace',
  },
] as const;

export const DEFAULT_FONT_ID: FontOptionId = 'inter';

export const FONT_SIZES = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
] as const;
export const DEFAULT_FONT_SIZE = '16px';

export type ColorSwatch = {
  id: string;
  value: string;
  /** Opaque tile? When false (light/white), we still render a thin ring. */
  needsRing?: boolean;
};

export const COLOR_ROW_NEUTRAL: readonly ColorSwatch[] = [
  { id: 'black', value: '#000000' },
  { id: 'charcoal', value: '#2D2D2D' },
  { id: 'darkGray', value: '#515151' },
  { id: 'gray', value: '#6B6B6B' },
  { id: 'midGray', value: '#9A9A9A' },
  { id: 'lightGray', value: '#C9C9C9', needsRing: true },
  { id: 'paleGray', value: '#E5E5E5', needsRing: true },
  { id: 'white', value: '#FFFFFF', needsRing: true },
] as const;

export const COLOR_ROW_ACCENT: readonly ColorSwatch[] = [
  { id: 'green', value: '#16A34A' },
  { id: 'blue', value: '#2563EB' },
  { id: 'indigo', value: '#4F46E5' },
  { id: 'purple', value: '#7C3AED' },
  { id: 'magenta', value: '#C026D3' },
  { id: 'pink', value: '#DB2777' },
  { id: 'red', value: '#DC2626' },
  { id: 'orange', value: '#EA580C' },
] as const;

export const COLOR_ROW_HIGHLIGHT: readonly ColorSwatch[] = [
  { id: 'highlightYellow', value: '#FEF08A' },
  { id: 'highlightOrange', value: '#FED7AA' },
  { id: 'highlightRed', value: '#FECACA' },
  { id: 'highlightPink', value: '#FBCFE8' },
  { id: 'highlightPurple', value: '#DDD6FE' },
  { id: 'highlightBlue', value: '#BFDBFE' },
  { id: 'highlightGreen', value: '#BBF7D0' },
  { id: 'highlightGray', value: '#E5E7EB', needsRing: true },
] as const;

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith('#')
    ? trimmed.toUpperCase()
    : `#${trimmed.toUpperCase()}`;
}

export type Mark = 'bold' | 'italic' | 'underline' | 'strike' | 'code';

// Toggle classes used by the bubble menu (dark surface): override the
// default toggle palette to read correctly on the editor-overlay
// background. Shared with `FormatToggle` / `AlignToggle` whenever they
// render inside the floating bubble.
export const INVERSE_TOGGLE_CLASS =
  'text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground data-[state=on]:bg-editor-overlay-foreground/20 data-[state=on]:text-editor-overlay-foreground aria-pressed:bg-editor-overlay-foreground/20 aria-pressed:text-editor-overlay-foreground';
