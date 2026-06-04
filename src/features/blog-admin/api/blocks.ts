'use server';

import { apiFetch } from '@/shared/api/client';

import type { BlogBlock } from '../model/types';

import {
  type Result,
  type VoidResult,
  mapBlock,
  reasonFor,
} from './_shared';

type BlockBodyWire = Parameters<typeof mapBlock>[0];

// Image (10 MB) and especially video (1 GB) uploads blow past apiFetch's
// default 15s timeout; give multipart calls a 10-minute ceiling so large
// files finish instead of aborting mid-transfer (mirrors products/api/blocks).
const MULTIPART_TIMEOUT_MS = 10 * 60 * 1000;

function blocksBase(postId: string): string {
  return `/admin/blog/posts/${encodeURIComponent(postId)}/blocks`;
}

async function readBlock(res: Response): Promise<BlogBlock> {
  const wire = (await res.json()) as BlockBodyWire;
  return mapBlock(wire);
}

// ---- HTML blocks (JSON) ---- //

export async function addHtmlBlockAction(args: {
  postId: string;
  html: string;
}): Promise<Result<BlogBlock>> {
  try {
    const res = await apiFetch(`${blocksBase(args.postId)}/html`, {
      method: 'POST',
      body: { html: args.html },
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true, data: await readBlock(res) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function updateHtmlBlockAction(args: {
  postId: string;
  blockId: string;
  html: string;
}): Promise<Result<BlogBlock>> {
  try {
    const res = await apiFetch(
      `${blocksBase(args.postId)}/${encodeURIComponent(args.blockId)}/html`,
      { method: 'PATCH', body: { html: args.html } },
    );
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true, data: await readBlock(res) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

// ---- Image / Video blocks (multipart) ---- //
//
// These actions take the browser-composed `FormData` so `File` instances
// survive the RSC serialization boundary. The caller appends `file` and
// the optional `caption`/`title` fields; omitting a field on PATCH keeps
// (file) or clears (caption/title) per the backend contract.

async function postMultipart(
  path: string,
  formData: FormData,
): Promise<Result<BlogBlock>> {
  try {
    const res = await apiFetch(path, {
      method: 'POST',
      body: formData,
      timeoutMs: MULTIPART_TIMEOUT_MS,
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true, data: await readBlock(res) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

async function patchMultipart(
  path: string,
  formData: FormData,
): Promise<Result<BlogBlock>> {
  try {
    const res = await apiFetch(path, {
      method: 'PATCH',
      body: formData,
      timeoutMs: MULTIPART_TIMEOUT_MS,
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true, data: await readBlock(res) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

export async function addImageBlockAction(
  postId: string,
  formData: FormData,
): Promise<Result<BlogBlock>> {
  return postMultipart(`${blocksBase(postId)}/image`, formData);
}

export async function updateImageBlockAction(
  postId: string,
  blockId: string,
  formData: FormData,
): Promise<Result<BlogBlock>> {
  return patchMultipart(
    `${blocksBase(postId)}/${encodeURIComponent(blockId)}/image`,
    formData,
  );
}

export async function addVideoBlockAction(
  postId: string,
  formData: FormData,
): Promise<Result<BlogBlock>> {
  return postMultipart(`${blocksBase(postId)}/video`, formData);
}

export async function updateVideoBlockAction(
  postId: string,
  blockId: string,
  formData: FormData,
): Promise<Result<BlogBlock>> {
  return patchMultipart(
    `${blocksBase(postId)}/${encodeURIComponent(blockId)}/video`,
    formData,
  );
}

// ---- Delete + reorder ---- //

export async function deleteBlockAction(args: {
  postId: string;
  blockId: string;
}): Promise<VoidResult> {
  try {
    const res = await apiFetch(
      `${blocksBase(args.postId)}/${encodeURIComponent(args.blockId)}`,
      { method: 'DELETE' },
    );
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * `PUT …/blocks/order` — `orderedIds` MUST be an exact permutation of the
 * post's current block ids (build it from cache via arrayMove); a partial
 * list returns 409 `invalid-reorder`.
 */
export async function reorderBlocksAction(args: {
  postId: string;
  orderedIds: string[];
}): Promise<VoidResult> {
  try {
    const res = await apiFetch(`${blocksBase(args.postId)}/order`, {
      method: 'PUT',
      body: { ordered_ids: args.orderedIds },
    });
    if (!res.ok) return { ok: false, reason: await reasonFor(res) };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
