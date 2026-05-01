/**
 * Maps a product id to a stable hue (0-360) so products without a real cover
 * still get a unique, consistent gradient across re-renders and SSR.
 */
export function hueFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function coverGradient(id: string): string {
  const hue = hueFromId(id);
  return `linear-gradient(135deg, oklch(0.85 0.12 ${hue}) 0%, oklch(0.62 0.2 ${(hue + 30) % 360}) 100%)`;
}
