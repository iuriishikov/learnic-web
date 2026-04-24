export const PLACEHOLDERS = {
  aurora: '/placeholders/01-aurora.svg',
  prismFade: '/placeholders/02-prism-fade.svg',
  heatmap: '/placeholders/03-heatmap.svg',
  liquidChrome: '/placeholders/04-liquid-chrome.svg',
  dreamyBlur: '/placeholders/05-dreamy-blur.svg',
  filmGrain: '/placeholders/06-film-grain.svg',
  dynamicMesh: '/placeholders/07-dynamic-mesh.svg',
  risograph: '/placeholders/08-risograph.svg',
} as const satisfies Record<string, `/placeholders/${string}.svg`>;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

export const PLACEHOLDER_KEYS = Object.keys(PLACEHOLDERS) as PlaceholderKey[];
