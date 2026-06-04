'use server';

import { apiFetch } from '@/shared/api/client';

import { type VoidResult, reasonFor } from './_shared';

const BASE = '/admin/blog/posts';

/** `POST /admin/blog/posts/{id}/publish` — 409 `status-conflict` if already published. */
export async function publishPostAction(id: string): Promise<VoidResult> {
  try {
    const res = await apiFetch(
      `${BASE}/${encodeURIComponent(id)}/publish`,
      { method: 'POST' },
    );
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** `POST /admin/blog/posts/{id}/unpublish` — 409 `status-conflict` if already draft. */
export async function unpublishPostAction(id: string): Promise<VoidResult> {
  try {
    const res = await apiFetch(
      `${BASE}/${encodeURIComponent(id)}/unpublish`,
      { method: 'POST' },
    );
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
