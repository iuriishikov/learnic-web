import 'server-only';

import { apiFetch } from '@/shared/api/client';

import { fromProductSchema, type ProductSchemaResponse } from './_shared';
import type { Product } from '../model/types';

export type GetUserProductsResult =
  | { ok: true; products: Product[] }
  | {
      ok: false;
      reason: 'bad-request' | 'service-unavailable' | 'network' | 'unknown';
    };

/**
 * List a user's PUBLISHED products (`GET /users/{user_id}/products`),
 * newest first.
 *
 * The backend returns only ``PUBLISHED`` rows authored by ``userId`` —
 * drafts and archived products are excluded — so a non-empty result means
 * the user has at least one product they released themselves. A note
 * becomes ``PUBLISHED`` solely by creating its first release, so this is
 * exactly "has shipped a note." An unknown ``userId`` yields an empty list
 * rather than a 404.
 */
export async function getUserProducts({
  userId,
  offset = 0,
  limit = 20,
}: {
  userId: string;
  offset?: number;
  limit?: number;
}): Promise<GetUserProductsResult> {
  try {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    const res = await apiFetch(
      `/users/${encodeURIComponent(userId)}/products?${params.toString()}`,
      { method: 'GET' },
    );

    if (res.status === 400 || res.status === 422) {
      return { ok: false, reason: 'bad-request' };
    }
    if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
    if (!res.ok) return { ok: false, reason: 'unknown' };

    const raw = (await res.json()) as ProductSchemaResponse[];
    return { ok: true, products: raw.map(fromProductSchema) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
