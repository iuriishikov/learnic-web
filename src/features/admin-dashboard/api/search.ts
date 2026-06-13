'use server';

import { apiFetch } from '@/shared/api/client';
import { toApiFile, type FileResponse } from '@/shared/types/user';

import type { AdminNoteResult, AdminUserResult } from '../model/search';

type SearchFailReason = 'unauthorized' | 'network' | 'unknown';

/* -------------------------------- users --------------------------------- */

// Mirrors `AdminUserSummarySchema` from `GET /admin/users/search`.
type UserSummaryWire = {
  oid: string;
  full_name: string;
  is_verified: boolean;
  is_banned: boolean;
  avatar: FileResponse | null;
};

function fromUserSummary(raw: UserSummaryWire): AdminUserResult {
  return {
    id: raw.oid,
    fullName: raw.full_name,
    avatar: raw.avatar !== null ? toApiFile(raw.avatar) : null,
    isVerified: raw.is_verified,
    isBanned: raw.is_banned,
  };
}

export type SearchUsersResult =
  | { ok: true; users: AdminUserResult[] }
  | { ok: false; reason: SearchFailReason };

/**
 * `GET /admin/users/search?q=&limit=` — admin-only fuzzy user search.
 * Same matching as the public `/users/search` but the projection adds
 * `is_banned` so the palette can offer a ban or an unban per result.
 */
export async function searchAdminUsersAction(args: {
  query: string;
  limit?: number;
}): Promise<SearchUsersResult> {
  const params = new URLSearchParams();
  params.set('q', args.query);
  params.set('limit', String(args.limit ?? 8));

  let res: Response;
  try {
    res = await apiFetch(`/admin/users/search?${params.toString()}`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as UserSummaryWire[];
  return { ok: true, users: raw.map(fromUserSummary) };
}

/* -------------------------------- notes --------------------------------- */

// Minimal projection of `ProductSchema` from `GET /products` — only the
// fields the note palette renders. The catalog endpoint returns every
// product type, so we keep `type` to filter down to notes.
type ProductSummaryWire = {
  oid: string;
  type: string;
  name: string;
  author: { full_name: string };
};

function fromProductSummary(raw: ProductSummaryWire): AdminNoteResult {
  return {
    id: raw.oid,
    title: raw.name,
    authorName: raw.author.full_name,
  };
}

export type SearchNotesResult =
  | { ok: true; notes: AdminNoteResult[] }
  | { ok: false; reason: SearchFailReason };

/**
 * `GET /products?q=&limit=` — full-text + fuzzy catalog search, filtered to
 * `note` products. Note: the public catalog only surfaces published, public
 * products, so this finds published notes (draft/archived moderation search
 * needs a dedicated admin endpoint — out of scope for "just search").
 */
export async function searchAdminNotesAction(args: {
  query: string;
  limit?: number;
}): Promise<SearchNotesResult> {
  const params = new URLSearchParams();
  params.set('q', args.query);
  params.set('limit', String(args.limit ?? 8));
  params.set('offset', '0');

  let res: Response;
  try {
    res = await apiFetch(`/products?${params.toString()}`, { method: 'GET' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: 'unauthorized' };
  }
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as ProductSummaryWire[];
  const notes = raw
    .filter((p) => p.type === 'note')
    .map(fromProductSummary);
  return { ok: true, notes };
}
