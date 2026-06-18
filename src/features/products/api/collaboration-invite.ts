'use server';

import { apiFetch } from '@/shared/api/client';

import { safeJson } from './_shared';

/**
 * Outcome of accepting a collaboration invite via the email-link token
 * (`POST /collaborations/{id}/accept-by-token`). The `409` family is
 * split so the landing page can show "expired" distinctly from a generic
 * "no longer available": the backend returns `{"error":"InviteTokenExpired"}`
 * for a lapsed TTL, and `InviteTokenMismatch` / `OperationNotAllowedInStatus`
 * (already accepted / declined / revoked) for the rest. The `403` family
 * (`NotResourceOwner` for by-user invites, `InviteEmailMismatch` for
 * by-email invites) collapses to `forbidden` — the signed-in account
 * doesn't match the invitee.
 */
export type AcceptCollaborationInviteOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'expired'
        | 'unavailable'
        | 'network'
        | 'unknown';
    };

export async function acceptCollaborationInviteByTokenAction(args: {
  collaborationId: string;
  token: string;
}): Promise<AcceptCollaborationInviteOutcome> {
  let res: Response;
  try {
    res = await apiFetch(
      `/collaborations/${encodeURIComponent(args.collaborationId)}/accept-by-token`,
      { method: 'POST', body: { token: args.token } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) {
    const body = await safeJson(res);
    const error = typeof body?.error === 'string' ? body.error : null;
    if (error === 'InviteTokenExpired') return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: false, reason: 'unknown' };
}
