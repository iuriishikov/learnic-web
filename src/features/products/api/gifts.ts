'use server';

import { apiFetch } from '@/shared/api/client';

import type { Gift, GiftStatus, GiftUserRef } from '../model/gifts';

import { type CreatedResult, safeJson } from './_shared';

/* -------------------------------------------------------------------------- */
/* Wire schemas                                                               */
/* -------------------------------------------------------------------------- */

type UserRefSchemaResponse = {
  oid: string;
  full_name: string;
  email: string;
};

// Mirrors the backend GiftSchema exhaustively. `status` lists every
// variant from GiftStatus so missing ones can't slip past `tsc`.
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
/* List                                                                       */
/* -------------------------------------------------------------------------- */

export type ListGiftsResult =
  | { ok: true; items: Gift[] }
  | {
      ok: false;
      reason: 'unauthorized' | 'forbidden' | 'not-found' | 'network' | 'unknown';
    };

export async function listProductGifts(args: {
  productId: string;
}): Promise<ListGiftsResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/gifts`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as { items: GiftSchemaResponse[] };
  return { ok: true, items: raw.items.map(fromGift) };
}

/* -------------------------------------------------------------------------- */
/* Issue                                                                      */
/* -------------------------------------------------------------------------- */

export async function sendGiftByUserAction(args: {
  productId: string;
  userId: string;
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/gifts/by-user`,
      { method: 'POST', body: { user_id: args.userId } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function sendGiftByEmailAction(args: {
  productId: string;
  email: string;
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/gifts/by-email`,
      { method: 'POST', body: { email: args.email } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function revokeGiftAction(args: {
  giftId: string;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      reason: 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'unknown';
    }
> {
  let res: Response;
  try {
    res = await apiFetch(`/gifts/${encodeURIComponent(args.giftId)}`, {
      method: 'DELETE',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'conflict' };
  return { ok: false, reason: 'unknown' };
}
