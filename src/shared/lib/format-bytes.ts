/**
 * Human-readable byte formatting for storage figures (e.g. "1,5 GB").
 *
 * Generic, pure, and project-agnostic — lives in `shared/lib` so any
 * surface (billing subscription card, note-storage plaque, …) renders
 * the same numbers the same way. Behavior is deliberately locale-aware
 * via `toLocaleString` (Russian uses a comma decimal separator) and caps
 * at one fraction digit.
 */
export function formatBytes(bytes: number, locale = 'ru-RU'): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx += 1;
  }
  return `${value.toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} ${units[unitIdx]}`;
}
