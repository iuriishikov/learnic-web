'use server';

import { apiFetch } from '@/shared/api/client';

/**
 * Outcome of an in-app gift Accept / Decline. Mirrors the
 * `InviteOutcome` union in `invite-actions.ts` so the gift card can
 * reuse the same status-mapping shape. The `409` family (token
 * mismatch / expired / operation-not-allowed-in-status) all collapse
 * to `unavailable` because, for the in-app endpoints, there is no
 * token and the only meaningful 409 is "the gift moved on".
 */
export type GiftOutcome =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'unavailable'
        | 'network'
        | 'unknown';
    };

export async function acceptGiftFromNotificationAction(args: {
  giftId: string;
}): Promise<GiftOutcome> {
  return performGiftResolution(args.giftId, 'accept');
}

export async function declineGiftFromNotificationAction(args: {
  giftId: string;
}): Promise<GiftOutcome> {
  return performGiftResolution(args.giftId, 'decline');
}

async function performGiftResolution(
  giftId: string,
  endpoint: 'accept' | 'decline',
): Promise<GiftOutcome> {
  let res: Response;
  try {
    res = await apiFetch(
      `/gifts/${encodeURIComponent(giftId)}/${endpoint}`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'unavailable' };
  return { ok: false, reason: 'unknown' };
}
