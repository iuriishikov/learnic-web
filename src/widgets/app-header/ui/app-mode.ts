export type AppMode = 'teach' | 'learn';

export const APP_MODE_COOKIE = 'learnic-mode';

export const DEFAULT_APP_MODE: AppMode = 'teach';

export function isAppMode(value: string | undefined): value is AppMode {
  return value === 'teach' || value === 'learn';
}
