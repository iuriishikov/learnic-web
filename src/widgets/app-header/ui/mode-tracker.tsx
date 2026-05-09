'use client';

import { useEffect } from 'react';

import { APP_MODE_COOKIE, type AppMode } from './app-mode';

/**
 * Persists the user's current app mode (`teach` | `learn`) in a cookie so
 * mode-neutral routes — currently `/settings` — can render the matching
 * header on the next request. The cookie is read server-side via
 * `next/headers` from `settings/layout.tsx`.
 */
export function ModeTracker({ mode }: { mode: AppMode }) {
  useEffect(() => {
    document.cookie = `${APP_MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
  }, [mode]);
  return null;
}
