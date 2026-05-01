import 'server-only';

import { apiFetch } from '@/shared/api/client';

import { fromProductSchema, type ProductSchemaResponse } from './_shared';
import type { Product } from '../model/types';

export type GetMyProductsResult =
  | { ok: true; products: Product[] }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown' };

export async function getMyProducts({
  offset = 0,
  limit = 20,
}: { offset?: number; limit?: number } = {}): Promise<GetMyProductsResult> {
  try {
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    const res = await apiFetch(`/products/mine?${params.toString()}`, {
      method: 'GET',
    });

    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    if (!res.ok) return { ok: false, reason: 'unknown' };

    const raw = (await res.json()) as ProductSchemaResponse[];
    return { ok: true, products: raw.map(fromProductSchema) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
