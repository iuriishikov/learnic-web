'use server';

import { apiFetch } from '@/shared/api/client';

import type { Gift, GiftStatus, GiftUserRef } from '../model/types';

/* -------------------------------------------------------------------------- */
/* Wire schema                                                                */
/* -------------------------------------------------------------------------- */

type UserRefSchemaResponse = {
  oid: string;
  full_name: string;
  email: string;
};

// Mirrors the backend GiftSchema. `status` lists every GiftStatus variant.
type GiftSchemaResponse = {
  oid: string;
  product_id: string;
  product_name: string;
  recipient: UserRefSchemaResponse | null;
  invited_email: string | null;
  status: GiftStatus;
  gifter: UserRefSchemaResponse;
  invite_expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
};

function fromUserRef(raw: UserRefSchemaResponse): GiftUserRef {
  return { id: raw.oid, fullName: raw.full_name, email: raw.email };
}

function fromGift(raw: GiftSchemaResponse): Gift {
  return {
    id: raw.oid,
    productId: raw.product_id,
    productName: raw.product_name,
    recipient: raw.recipient ? fromUserRef(raw.recipient) : null,
    invitedEmail: raw.invited_email,
    status: raw.status,
    gifter: fromUserRef(raw.gifter),
    inviteExpiresAt: raw.invite_expires_at,
    createdAt: raw.created_at,
    acceptedAt: raw.accepted_at,
    declinedAt: raw.declined_at,
    revokedAt: raw.revoked_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Get gift                                                                   */
/* -------------------------------------------------------------------------- */

export type GetGiftResult =
  | { ok: true; gift: Gift }
  | {
      ok: false;
      reason: 'unauthorized' | 'forbidden' | 'not-found' | 'network' | 'unknown';
    };

export async function getGiftAction(args: {
  giftId: string;
}): Promise<GetGiftResult> {
  let res: Response;
  try {
    res = await apiFetch(`/gifts/${encodeURIComponent(args.giftId)}`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as GiftSchemaResponse;
  return { ok: true, gift: fromGift(raw) };
}

/* -------------------------------------------------------------------------- */
/* Accept by token / decline                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Outcome of accept-by-token / decline. The `409` family
 * (`InviteTokenMismatch`, `InviteTokenExpired`,
 * `OperationNotAllowedInGiftStatusError`) is split so the landing page
 * can show "expired" distinctly from a generic "no longer available".
 * The `403` family (`NotResourceOwner`, `InviteEmailMismatch`) collapses
 * to `forbidden` — the email/account doesn't match the gift.
 */
export type GiftResolveOutcome =
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

export async function acceptGiftByTokenAction(args: {
  giftId: string;
  token: string;
}): Promise<GiftResolveOutcome> {
  let res: Response;
  try {
    res = await apiFetch(
      `/gifts/${encodeURIComponent(args.giftId)}/accept-by-token`,
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
    const body = await safeReadError(res);
    if (body === 'InviteTokenExpired') return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'unavailable' };
  }
  return { ok: false, reason: 'unknown' };
}

export async function declineGiftAction(args: {
  giftId: string;
}): Promise<GiftResolveOutcome> {
  let res: Response;
  try {
    res = await apiFetch(
      `/gifts/${encodeURIComponent(args.giftId)}/decline`,
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

async function safeReadError(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { error?: unknown };
    return typeof data.error === 'string' ? data.error : null;
  } catch {
    return null;
  }
}
