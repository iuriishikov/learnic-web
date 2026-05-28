import 'server-only';

import { apiFetch } from '@/shared/api/client';

import { fromProductSchema, type ProductSchemaResponse } from './_shared';
import type { Product } from '../model/types';

export type GetMyProductsResult =
  | { ok: true; products: Product[]; total: number }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'bad-request'
        | 'service-unavailable'
        | 'network'
        | 'unknown';
    };

export async function getMyProducts({
  offset = 0,
  limit = 20,
  q,
}: {
  offset?: number;
  limit?: number;
  // Free-text search (backend ``GET /products/mine?q=...``). When
  // provided, the backend switches from newest-first list mode to
  // the same weighted full-text + ``pg_trgm`` fuzzy search used by
  // the public catalog, restricted to the caller's accessible set.
  // Trimmed and dropped if shorter than the backend's
  // ``SEARCH_QUERY_MIN_LEN`` (2 chars) so we don't 422 on
  // single-character input.
  q?: string;
} = {}): Promise<GetMyProductsResult> {
  try {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    const trimmed = q?.trim() ?? '';
    if (trimmed.length >= 2) params.set('q', trimmed);
    const res = await apiFetch(`/products/mine?${params.toString()}`, {
      method: 'GET',
    });

    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    if (res.status === 403) return { ok: false, reason: 'forbidden' };
    if (res.status === 400) return { ok: false, reason: 'bad-request' };
    if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
    if (!res.ok) return { ok: false, reason: 'unknown' };

    const raw = (await res.json()) as ProductSchemaResponse[];
    // Total comes from the ``X-Total-Count`` response header
    // (see ``GET /products/mine`` in ``openapi.json``) — keeps the
    // JSON body a plain array. Header missing → fall back to the
    // current page's length so the UI never NaN-divides.
    const totalHeader = res.headers.get('x-total-count');
    const total =
      totalHeader !== null && Number.isFinite(Number(totalHeader))
        ? Number(totalHeader)
        : raw.length;
    return { ok: true, products: raw.map(fromProductSchema), total };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
