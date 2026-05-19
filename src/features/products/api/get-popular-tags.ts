import 'server-only';

import type { Tag } from '@/features/product-tags';
import { apiFetch } from '@/shared/api/client';

export type GetPopularTagsResult =
  | { ok: true; tags: Tag[] }
  | { ok: false; reason: 'network' | 'unknown' };

type TagWire = {
  oid: string;
  name: string;
  color: string;
};

type TagListWire = {
  items: TagWire[];
};

/**
 * Top-``limit`` tags across published products, ranked by usage count.
 *
 * One backend call (``GET /tags/popular?limit=N``) — the previous
 * "sample 500 products and aggregate client-side" workaround is
 * gone. The backend's :class:`GetPopularTagsQueryHandler` runs a
 * single SQL aggregate against ``product_tags`` joined to
 * ``products`` (published only) and returns the ranked slice.
 */
export async function getPopularTags({
  limit = 20,
}: { limit?: number } = {}): Promise<GetPopularTagsResult> {
  let res: Response;
  try {
    res = await apiFetch(`/tags/popular?limit=${limit}`, { method: 'GET' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) {
    return { ok: false, reason: 'unknown' };
  }
  const body = (await res.json()) as TagListWire;
  const tags: Tag[] = body.items.map((raw) => ({
    id: raw.oid,
    name: raw.name,
    color: raw.color,
  }));
  return { ok: true, tags };
}
