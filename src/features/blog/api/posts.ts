'use server';

import { apiFetch } from '@/shared/api/client';

import type { PublishedPost, PublishedPostSummary } from '../model/types';

import {
  type PublishedPostSummaryWire,
  type PublishedPostWire,
  type Result,
  mapPost,
  mapSummary,
  reasonFor,
} from './_shared';

/** `GET /blog/posts` — public index of published posts, newest first. */
export async function listPublishedPostsAction(args: {
  limit?: number;
  offset?: number;
}): Promise<Result<PublishedPostSummary[]>> {
  const params = new URLSearchParams();
  params.set('offset', String(args.offset ?? 0));
  params.set('limit', String(args.limit ?? 20));
  try {
    const res = await apiFetch(`/blog/posts?${params.toString()}`, {
      method: 'GET',
    });
    if (!res.ok) return { ok: false, reason: reasonFor(res) };
    const wire = (await res.json()) as PublishedPostSummaryWire[];
    return { ok: true, data: wire.map(mapSummary) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `GET /blog/posts/{slug}` — a published post with its ordered blocks. */
export async function getPublishedPostAction(
  slug: string,
): Promise<Result<PublishedPost>> {
  try {
    const res = await apiFetch(`/blog/posts/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });
    if (!res.ok) return { ok: false, reason: reasonFor(res) };
    const wire = (await res.json()) as PublishedPostWire;
    return { ok: true, data: mapPost(wire) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
