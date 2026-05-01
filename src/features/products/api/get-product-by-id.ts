import 'server-only';

import { apiFetch } from '@/shared/api/client';

import { fromProductSchema, type ProductSchemaResponse } from './_shared';
import type { Product } from '../model/types';

export type GetProductByIdResult =
  | { ok: true; product: Product }
  | { ok: false; reason: 'not-found' | 'network' | 'unknown' };

export async function getProductById(
  productId: string,
): Promise<GetProductByIdResult> {
  try {
    const res = await apiFetch(`/products/${encodeURIComponent(productId)}`, {
      method: 'GET',
    });
    if (res.status === 404) return { ok: false, reason: 'not-found' };
    if (!res.ok) return { ok: false, reason: 'unknown' };
    const raw = (await res.json()) as ProductSchemaResponse;
    return { ok: true, product: fromProductSchema(raw) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
