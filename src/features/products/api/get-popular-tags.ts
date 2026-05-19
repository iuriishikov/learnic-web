import 'server-only';

import { apiFetch } from '@/shared/api/client';
import type { Tag } from '@/features/product-tags';

import { getPublishedProducts } from './get-published';

type TagWire = {
  oid: string;
  name: string;
  color: string;
};

export type GetPopularTagsResult =
  | { ok: true; tags: Tag[] }
  | { ok: false; reason: 'network' | 'unknown' };

const PRODUCT_PAGE_SIZE = 100;
// 100 products × 5 pages = 500 sampled — keeps SSR bounded while still
// covering small/medium catalogs end-to-end. Bump if the catalog
// outgrows this.
const MAX_PRODUCT_PAGES = 5;
// Per-page tag fan-out runs in parallel via Promise.all — 100 is fine
// against a local backend; tune if upstream rate-limits land.

export async function getPopularTags({
  limit = 20,
}: { limit?: number } = {}): Promise<GetPopularTagsResult> {
  const productIds: string[] = [];
  for (let page = 0; page < MAX_PRODUCT_PAGES; page++) {
    const result = await getPublishedProducts({
      offset: page * PRODUCT_PAGE_SIZE,
      limit: PRODUCT_PAGE_SIZE,
    });
    if (!result.ok) {
      // Don't fail the whole tags load on a transient pagination error
      // — return whatever we've sampled so far.
      if (productIds.length === 0) {
        return {
          ok: false,
          reason: result.reason === 'network' ? 'network' : 'unknown',
        };
      }
      break;
    }
    for (const product of result.products) productIds.push(product.id);
    if (result.products.length < PRODUCT_PAGE_SIZE) break;
  }

  if (productIds.length === 0) return { ok: true, tags: [] };

  const tagLists = await Promise.all(
    productIds.map(async (id) => {
      try {
        const res = await apiFetch(
          `/products/${encodeURIComponent(id)}/tags`,
          { method: 'GET' },
        );
        if (!res.ok) return [] as TagWire[];
        const data = (await res.json()) as { items: TagWire[] };
        return data.items;
      } catch {
        return [] as TagWire[];
      }
    }),
  );

  const aggregates = new Map<string, { tag: Tag; count: number }>();
  for (const list of tagLists) {
    for (const raw of list) {
      const existing = aggregates.get(raw.oid);
      if (existing) {
        existing.count += 1;
      } else {
        aggregates.set(raw.oid, {
          tag: { id: raw.oid, name: raw.name, color: raw.color },
          count: 1,
        });
      }
    }
  }

  const sorted = [...aggregates.values()]
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.tag.name.localeCompare(b.tag.name);
    })
    .slice(0, limit)
    .map((entry) => entry.tag);

  return { ok: true, tags: sorted };
}
