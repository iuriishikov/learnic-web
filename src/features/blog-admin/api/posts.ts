'use server';

import { apiFetch } from '@/shared/api/client';

import type { BlogPost, BlogPostStatus, BlogPostSummary } from '../model/types';

import {
  type BlogPostSummaryWire,
  type BlogPostWire,
  type Result,
  type VoidResult,
  mapPost,
  mapSummary,
  reasonFor,
} from './_shared';

const BASE = '/admin/blog/posts';

export type BlogPostsPage = {
  items: BlogPostSummary[];
  total: number;
};

/** `GET /admin/blog/posts` — admin list in any status, paginated. */
export async function listPostsAction(args: {
  status?: BlogPostStatus;
  offset?: number;
  limit?: number;
}): Promise<Result<BlogPostsPage>> {
  const params = new URLSearchParams();
  if (args.status) params.set('status', args.status);
  params.set('offset', String(args.offset ?? 0));
  params.set('limit', String(args.limit ?? 20));
  try {
    const res = await apiFetch(`${BASE}?${params.toString()}`, {
      method: 'GET',
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    const wire = (await res.json()) as BlogPostSummaryWire[];
    const total = Number(res.headers.get('X-Total-Count') ?? wire.length);
    return {
      ok: true,
      data: { items: wire.map(mapSummary), total: Number.isFinite(total) ? total : wire.length },
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `GET /admin/blog/posts/{id}` — full post with blocks, any status. */
export async function getPostAction(id: string): Promise<Result<BlogPost>> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    const wire = (await res.json()) as BlogPostWire;
    return { ok: true, data: mapPost(wire) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `POST /admin/blog/posts` — create a draft; returns the new id. */
export async function createPostAction(args: {
  title: string;
  slug: string;
}): Promise<Result<{ id: string }>> {
  try {
    const res = await apiFetch(BASE, {
      method: 'POST',
      body: { title: args.title, slug: args.slug },
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    const wire = (await res.json()) as { oid: string };
    return { ok: true, data: { id: wire.oid } };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `PATCH /admin/blog/posts/{id}/title`. */
export async function renamePostAction(args: {
  id: string;
  title: string;
}): Promise<VoidResult> {
  try {
    const res = await apiFetch(
      `${BASE}/${encodeURIComponent(args.id)}/title`,
      { method: 'PATCH', body: { title: args.title } },
    );
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `PATCH /admin/blog/posts/{id}/slug` — 409 `slug-taken` on collision. */
export async function changeSlugAction(args: {
  id: string;
  slug: string;
}): Promise<VoidResult> {
  try {
    const res = await apiFetch(
      `${BASE}/${encodeURIComponent(args.id)}/slug`,
      { method: 'PATCH', body: { slug: args.slug } },
    );
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `DELETE /admin/blog/posts/{id}` — hard delete, cascades blocks + files. */
export async function deletePostAction(id: string): Promise<VoidResult> {
  try {
    const res = await apiFetch(`${BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
