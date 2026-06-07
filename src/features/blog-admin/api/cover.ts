'use server';

import { apiFetch } from '@/shared/api/client';

import type { BlogPost } from '../model/types';

import { type BlogPostWire, type Result, mapPost, reasonFor } from './_shared';

const BASE = '/admin/blog/posts';

// A 10 MB cover can outrun apiFetch's default 15s timeout on a slow
// connection; give the multipart upload a generous ceiling (mirrors
// the image/video block uploads in `api/blocks.ts`).
const MULTIPART_TIMEOUT_MS = 10 * 60 * 1000;

function coverPath(postId: string): string {
  return `${BASE}/${encodeURIComponent(postId)}/cover`;
}

/**
 * `POST /admin/blog/posts/{id}/cover` — upload (or replace) the cover.
 *
 * Takes the browser-composed `FormData` (field `file`) so the `File`
 * survives the RSC serialization boundary. Returns the full updated post
 * (cover resolved to a presigned URL) so the editor can update in place.
 */
export async function setCoverAction(
  postId: string,
  formData: FormData,
): Promise<Result<BlogPost>> {
  try {
    const res = await apiFetch(coverPath(postId), {
      method: 'POST',
      body: formData,
      timeoutMs: MULTIPART_TIMEOUT_MS,
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    const wire = (await res.json()) as BlogPostWire;
    return { ok: true, data: mapPost(wire) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `DELETE /admin/blog/posts/{id}/cover` — detach the cover. */
export async function removeCoverAction(
  postId: string,
): Promise<Result<BlogPost>> {
  try {
    const res = await apiFetch(coverPath(postId), { method: 'DELETE' });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    const wire = (await res.json()) as BlogPostWire;
    return { ok: true, data: mapPost(wire) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
