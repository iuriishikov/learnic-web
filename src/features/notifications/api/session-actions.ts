'use server';

import { apiFetch } from '@/shared/api/client';

export type RevokeSessionOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: 'unauthorized' | 'not-found' | 'network' | 'unknown';
    };

export async function revokeSessionFromNotificationAction(args: {
  sessionId: string;
}): Promise<RevokeSessionOutcome> {
  if (!args.sessionId) return { ok: false, reason: 'unknown' };
  let res: Response;
  try {
    res = await apiFetch(
      `/auth/sessions/${encodeURIComponent(args.sessionId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  return { ok: false, reason: 'unknown' };
}
