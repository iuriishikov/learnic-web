'use server';

import { apiFetch } from '@/shared/api/client';

export type InviteOutcome =
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

/** @deprecated Use {@link InviteOutcome}. */
export type AcceptInviteOutcome = InviteOutcome;

export async function acceptInvitationFromNotificationAction(args: {
  collaborationId: string;
}): Promise<InviteOutcome> {
  return performInviteResolution(args.collaborationId, 'accept-in-app');
}

export async function declineInvitationFromNotificationAction(args: {
  collaborationId: string;
}): Promise<InviteOutcome> {
  return performInviteResolution(args.collaborationId, 'decline-in-app');
}

async function performInviteResolution(
  collaborationId: string,
  endpoint: 'accept-in-app' | 'decline-in-app',
): Promise<InviteOutcome> {
  let res: Response;
  try {
    res = await apiFetch(
      `/collaborations/${encodeURIComponent(collaborationId)}/${endpoint}`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 422) {
    const body = await safeReadError(res);
    if (body === 'InviteTokenExpired') return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: false, reason: 'unknown' };
}

async function safeReadError(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: unknown };
    return typeof data.error === 'string' ? data.error : null;
  } catch {
    return null;
  }
}
