// Shared types for the ColorInput component family.

export type HSV = {
  h: number; // 0..360
  s: number; // 0..100
  v: number; // 0..100
};

export type RGB = {
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
};

export type SolidValue = {
  kind: 'solid';
  /** 6-digit hex (no alpha), uppercase. Example: '#7F56D9'. */
  hex: string;
  /** 0..100 (display units). */
  opacity: number;
};

export type GradientStop = {
  id: string;
  /** 0..100 along the gradient axis. */
  position: number;
  hex: string;
  opacity: number;
};

export type GradientValue = {
  kind: 'gradient';
  type: 'linear' | 'radial';
  /** 0..360 (only used for `linear`). */
  angle: number;
  stops: GradientStop[];
};

export type ImageAdjustments = {
  exposure: number;
  contrast: number;
  saturation: number;
  temperature: number;
  tint: number;
  highlights: number;
  shadows: number;
};

export type ImageValue = {
  kind: 'image';
  /** Object URL or remote URL. Empty string means "no image". */
  src: string;
  fit: 'fill' | 'cover' | 'contain' | 'tile';
  adjustments: ImageAdjustments;
};

export type ColorValue = SolidValue | GradientValue | ImageValue;

export type ColorMode = 'solid' | 'gradient' | 'image';

export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  exposure: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
};
