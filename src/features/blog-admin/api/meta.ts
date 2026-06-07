'use server';

import { apiFetch } from '@/shared/api/client';

import type { BlogPost } from '../model/types';

import { type BlogPostWire, type Result, mapPost, reasonFor } from './_shared';

const BASE = '/admin/blog/posts';

/**
 * `PATCH /admin/blog/posts/{id}/meta` — set the post's editorial
 * metadata: the `topic` (category label above the title) and `subtitle`
 * (short description under the title). Both are replaced wholesale —
 * `null` or a blank string clears the field. The author's name and
 * avatar come from the creating admin and are not set here.
 *
 * Returns the full updated post so the editor can update in place.
 */
export async function editPostMetaAction(
  postId: string,
  data: { subtitle: string | null; topic: string | null },
): Promise<Result<BlogPost>> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(postId)}/meta`, {
      method: 'PATCH',
      body: { subtitle: data.subtitle, topic: data.topic },
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    const wire = (await res.json()) as BlogPostWire;
    return { ok: true, data: mapPost(wire) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
