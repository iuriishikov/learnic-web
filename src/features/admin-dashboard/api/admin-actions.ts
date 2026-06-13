'use server';

import { apiFetch } from '@/shared/api/client';

export type AdminActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'unauthorized' | 'forbidden' | 'not-found' | 'network' | 'unknown';
    };

function reasonForStatus(status: number): AdminActionResult {
  if (status === 401) return { ok: false, reason: 'unauthorized' };
  if (status === 403) return { ok: false, reason: 'forbidden' };
  if (status === 404) return { ok: false, reason: 'not-found' };
  return { ok: false, reason: 'unknown' };
}

async function adminMutate(
  path: string,
  method: 'POST' | 'DELETE',
  body?: Record<string, unknown>,
): Promise<AdminActionResult> {
  let res: Response;
  try {
    res = await apiFetch(path, { method, body });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.ok) return { ok: true };
  return reasonForStatus(res.status);
}

/** `POST /admin/users/{id}/ban` — ban a user and revoke their sessions. */
export async function banUserAction(userId: string): Promise<AdminActionResult> {
  return adminMutate(
    `/admin/users/${encodeURIComponent(userId)}/ban`,
    'POST',
  );
}

/** `POST /admin/users/{id}/unban` — lift a user's ban (the inverse of ban). */
export async function unbanUserAction(
  userId: string,
): Promise<AdminActionResult> {
  return adminMutate(
    `/admin/users/${encodeURIComponent(userId)}/unban`,
    'POST',
  );
}

/**
 * `POST /admin/users/{id}/subscription` — grant the BETA tariff free of
 * charge, indefinitely (no `expires_at`).
 */
export async function grantBetaAction(
  userId: string,
): Promise<AdminActionResult> {
  return adminMutate(
    `/admin/users/${encodeURIComponent(userId)}/subscription`,
    'POST',
    { plan_code: 'BETA' },
  );
}

/** `DELETE /admin/users/{id}/subscription` — revoke active grants → FREE. */
export async function revokeTariffAction(
  userId: string,
): Promise<AdminActionResult> {
  return adminMutate(
    `/admin/users/${encodeURIComponent(userId)}/subscription`,
    'DELETE',
  );
}

/** `DELETE /admin/notes/{id}` — permanently delete a note (irreversible). */
export async function deleteNoteAction(
  noteId: string,
): Promise<AdminActionResult> {
  return adminMutate(
    `/admin/notes/${encodeURIComponent(noteId)}`,
    'DELETE',
  );
}
