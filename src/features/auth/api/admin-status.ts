import 'server-only';

import { cache } from 'react';

import { apiFetch } from '@/shared/api/client';

/** Wire shape of `GET /users/me/admin-status` (`AdminStatusSchema`). */
type AdminStatusResponse = {
  is_admin: boolean;
};

/**
 * Whether the authenticated caller is a platform administrator.
 *
 * Backed by the dedicated `GET /users/me/admin-status` endpoint — the
 * flag is intentionally NOT part of `GET /auth/me` (that projection is
 * shared with the public profile read). Degrades to `false` for
 * anonymous callers or any non-200, so the UI never shows admin
 * affordances on an uncertain answer. `cache()` dedupes the call
 * within a single server render (root layout + admin layout).
 */
export const getMyAdminStatus = cache(async (): Promise<boolean> => {
  try {
    const res = await apiFetch('/users/me/admin-status', { method: 'GET' });
    if (res.status !== 200) return false;
    const raw = (await res.json()) as AdminStatusResponse;
    return raw.is_admin === true;
  } catch {
    return false;
  }
});
