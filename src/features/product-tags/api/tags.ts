'use server';

import { apiFetch } from '@/shared/api/client';

import type { Tag, UpdateProductTagsItem } from '../model/types';

type TagWire = {
  oid: string;
  name: string;
  color: string;
};

function toTag(raw: TagWire): Tag {
  return { id: raw.oid, name: raw.name, color: raw.color };
}

export type SearchTagsResult =
  | { ok: true; items: Tag[] }
  | { ok: false; reason: 'network' | 'unknown' };

export async function searchTagsAction(args: {
  query: string;
  limit?: number;
}): Promise<SearchTagsResult> {
  const params = new URLSearchParams();
  if (args.query) params.set('query', args.query);
  if (args.limit !== undefined) params.set('limit', String(args.limit));
  let res: Response;
  try {
    res = await apiFetch(`/tags?${params.toString()}`, { method: 'GET' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const data = (await res.json()) as { items: TagWire[] };
  return { ok: true, items: data.items.map(toTag) };
}

export type GetProductTagsResult =
  | { ok: true; items: Tag[] }
  | { ok: false; reason: 'network' | 'unknown' };

export async function getProductTagsAction(
  productId: string,
): Promise<GetProductTagsResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(productId)}/tags`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const data = (await res.json()) as { items: TagWire[] };
  return { ok: true, items: data.items.map(toTag) };
}

export type UpdateProductTagsResult =
  | { ok: true; items: Tag[] }
  | { ok: false; reason: 'network' | 'forbidden' | 'validation' | 'unknown' };

export async function updateProductTagsAction(args: {
  productId: string;
  items: UpdateProductTagsItem[];
}): Promise<UpdateProductTagsResult> {
  const body = {
    items: args.items.map((item) =>
      item.kind === 'existing'
        ? { tag_id: item.tagId }
        : { name: item.name, color: item.color },
    ),
  };
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/tags`,
      { method: 'PUT', body },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 422) return { ok: false, reason: 'validation' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const data = (await res.json()) as { items: TagWire[] };
  return { ok: true, items: data.items.map(toTag) };
}
