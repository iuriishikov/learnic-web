'use server';

import { apiFetch } from '@/shared/api/client';

import type { CodeTab, LessonBlock } from '../model/draft';
import {
  fromBlockResponse,
  type LessonBlockResponse,
} from '../lib/draft-wire';

import {
  type BlockMutationResult,
  type CreatedResult,
  type MutationResult,
  mapErrorResponse,
  mapMutationStatus,
  safeJson,
} from './_shared';

// Author-side option payload — option ids are minted by the backend
// (no stable identity needed across edits, see UpdateSingleChoice-
// BlockCommand docstring), so the client only sends label + flag.
export type ChoiceOptionDraftInput = {
  label: string;
  isCorrect: boolean;
};

function _toOptionsWire(
  options: ChoiceOptionDraftInput[],
): Array<{ label: string; is_correct: boolean }> {
  return options.map((o) => ({ label: o.label, is_correct: o.isCorrect }));
}

export async function addHtmlBlockAction(args: {
  courseId: string;
  lessonId: string;
  html: string;
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'html', { html: args.html });
}

export async function addKatexBlockAction(args: {
  courseId: string;
  lessonId: string;
  source: string;
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'katex', {
    source: args.source,
  });
}

export async function addRutubeVideoBlockAction(args: {
  courseId: string;
  lessonId: string;
  rutubeUrl: string;
  title: string | null;
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'rutube-video', {
    rutube_url: args.rutubeUrl,
    title: args.title,
  });
}

export async function addCodeBlockAction(args: {
  courseId: string;
  lessonId: string;
  tabs: CodeTab[];
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'code', {
    tabs: args.tabs,
  });
}

export async function addSingleChoiceBlockAction(args: {
  courseId: string;
  lessonId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'single-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function addMultiChoiceBlockAction(args: {
  courseId: string;
  lessonId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'multi-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function addTextInputBlockAction(args: {
  courseId: string;
  lessonId: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
}): Promise<CreatedResult> {
  return addBlock(args.courseId, args.lessonId, 'text-input', {
    accepted_answers: args.acceptedAnswers,
    case_sensitive: args.caseSensitive,
    trim_whitespace: args.trimWhitespace,
  });
}

async function addBlock(
  courseId: string,
  lessonId: string,
  type:
    | 'html'
    | 'katex'
    | 'rutube-video'
    | 'code'
    | 'single-choice'
    | 'multi-choice'
    | 'text-input',
  body: Record<string, unknown>,
): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/blocks/${type}`,
      { method: 'POST', body },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 201) {
    const json = (await res.json()) as { oid: string };
    return { ok: true, id: json.oid };
  }
  if (res.status === 422) {
    const json = await safeJson(res);
    const message = typeof json?.error === 'string' ? json.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'conflict' };
  return { ok: false, reason: 'unknown' };
}

export async function updateHtmlBlockAction(args: {
  courseId: string;
  blockId: string;
  html: string;
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'html', { html: args.html });
}

export async function updateKatexBlockAction(args: {
  courseId: string;
  blockId: string;
  source: string;
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'katex', {
    source: args.source,
  });
}

export async function updateRutubeVideoBlockAction(args: {
  courseId: string;
  blockId: string;
  rutubeUrl: string;
  title: string | null;
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'rutube-video', {
    rutube_url: args.rutubeUrl,
    title: args.title,
  });
}

export async function updateCodeBlockAction(args: {
  courseId: string;
  blockId: string;
  tabs: CodeTab[];
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'code', {
    tabs: args.tabs,
  });
}

export async function updateSingleChoiceBlockAction(args: {
  courseId: string;
  blockId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'single-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function updateMultiChoiceBlockAction(args: {
  courseId: string;
  blockId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'multi-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function updateTextInputBlockAction(args: {
  courseId: string;
  blockId: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
}): Promise<MutationResult> {
  return patchBlock(args.courseId, args.blockId, 'text-input', {
    accepted_answers: args.acceptedAnswers,
    case_sensitive: args.caseSensitive,
    trim_whitespace: args.trimWhitespace,
  });
}

async function patchBlock(
  courseId: string,
  blockId: string,
  type:
    | 'html'
    | 'katex'
    | 'rutube-video'
    | 'code'
    | 'single-choice'
    | 'multi-choice'
    | 'text-input',
  body: Record<string, unknown>,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/${type}`,
      { method: 'PATCH', body },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function reorderLessonBlocksAction(args: {
  courseId: string;
  lessonId: string;
  orderedIds: string[];
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(args.courseId)}/lessons/${encodeURIComponent(args.lessonId)}/blocks/order`,
      { method: 'PUT', body: { ordered_ids: args.orderedIds } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteLessonBlockAction(args: {
  courseId: string;
  blockId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(args.courseId)}/blocks/${encodeURIComponent(args.blockId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

/* ---------- file / video-file / photo-collage (multipart) ---------- */

// Client → server actions for these block types take the `FormData`
// the browser composes (so `File` instances survive RSC's serialisation
// boundary) and forward it to the backend's `multipart/form-data`
// endpoint. The mapping back into the camelCase `BlockMutationResult`
// shape is shared via `mapErrorResponse` on the failure side and
// `fromBlockResponse` on the success side.

// Lesson uploads can reach 1 GB (video) and ~960 MB (12-photo
// collage). The default `apiFetch` timeout (15s) caps out around
// ~15 MB on a typical residential uplink — pump it up so large
// uploads actually complete instead of aborting mid-transfer.
const _MULTIPART_TIMEOUT_MS = 10 * 60 * 1000;

// Both helpers parse the full block-schema body the backend returns on
// success so the caller can splice the new entity straight into the
// course-draft cache, skipping a follow-up GET. Error responses still
// flow through `mapErrorResponse` so quota / wrong-content-type
// metadata is preserved.
//
// 204 (legacy backend that hasn't been redeployed yet) or any 2xx with
// an unparseable body returns `{ ok: true }` without a block — the
// hook then falls back to invalidating the draft cache, so the editor
// still sees the new state and never trips the failure toast just
// because the response shape changed.
async function _readBlockBody(res: Response): Promise<LessonBlock | undefined> {
  if (res.status === 204) return undefined;
  try {
    const raw = (await res.json()) as LessonBlockResponse;
    return fromBlockResponse(raw);
  } catch {
    return undefined;
  }
}

async function _postMultipartBlock(
  path: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  let res: Response;
  try {
    res = await apiFetch(path, {
      method: 'POST',
      body: formData,
      timeoutMs: _MULTIPART_TIMEOUT_MS,
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status >= 200 && res.status < 300) {
    const block = await _readBlockBody(res);
    return block ? { ok: true, block } : { ok: true };
  }
  return mapErrorResponse(res);
}

async function _patchMultipartBlock(
  path: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  let res: Response;
  try {
    res = await apiFetch(path, {
      method: 'PATCH',
      body: formData,
      timeoutMs: _MULTIPART_TIMEOUT_MS,
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status >= 200 && res.status < 300) {
    const block = await _readBlockBody(res);
    return block ? { ok: true, block } : { ok: true };
  }
  return mapErrorResponse(res);
}

export async function addFileBlockAction(
  courseId: string,
  lessonId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/blocks/file`,
    formData,
  );
}

export async function updateFileBlockAction(
  courseId: string,
  blockId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _patchMultipartBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/file`,
    formData,
  );
}

export async function addVideoFileBlockAction(
  courseId: string,
  lessonId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/blocks/video-file`,
    formData,
  );
}

export async function updateVideoFileBlockAction(
  courseId: string,
  blockId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _patchMultipartBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/video-file`,
    formData,
  );
}

export async function addPhotoCollageBlockAction(
  courseId: string,
  lessonId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/blocks/photo-collage`,
    formData,
  );
}

// Per-item collage operations live below. After the JSONB → child-
// table migration on the backend, the editor edits items one at a
// time: add one photo / remove one photo / reorder / re-caption.
// Each endpoint returns the full updated block so the SPA splices
// the new state into the cache without a follow-up GET.

async function _deleteBlock(path: string): Promise<BlockMutationResult> {
  let res: Response;
  try {
    res = await apiFetch(path, { method: 'DELETE' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status >= 200 && res.status < 300) {
    const block = await _readBlockBody(res);
    return block ? { ok: true, block } : { ok: true };
  }
  return mapErrorResponse(res);
}

async function _putJsonBlock(
  path: string,
  body: Record<string, unknown>,
): Promise<BlockMutationResult> {
  let res: Response;
  try {
    res = await apiFetch(path, { method: 'PUT', body });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status >= 200 && res.status < 300) {
    const block = await _readBlockBody(res);
    return block ? { ok: true, block } : { ok: true };
  }
  return mapErrorResponse(res);
}

async function _patchJsonBlock(
  path: string,
  body: Record<string, unknown>,
): Promise<BlockMutationResult> {
  let res: Response;
  try {
    res = await apiFetch(path, { method: 'PATCH', body });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status >= 200 && res.status < 300) {
    const block = await _readBlockBody(res);
    return block ? { ok: true, block } : { ok: true };
  }
  return mapErrorResponse(res);
}

export async function addCollageItemAction(
  courseId: string,
  blockId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items`,
    formData,
  );
}

export async function removeCollageItemAction(
  courseId: string,
  blockId: string,
  itemId: string,
): Promise<BlockMutationResult> {
  return _deleteBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items/${encodeURIComponent(itemId)}`,
  );
}

export async function reorderCollageItemsAction(
  courseId: string,
  blockId: string,
  orderedIds: string[],
): Promise<BlockMutationResult> {
  return _putJsonBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items/order`,
    { ordered_ids: orderedIds },
  );
}

export async function updateCollageItemCaptionAction(
  courseId: string,
  blockId: string,
  itemId: string,
  caption: string | null,
): Promise<BlockMutationResult> {
  return _patchJsonBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items/${encodeURIComponent(itemId)}/caption`,
    { caption },
  );
}

export async function updateCollageTitleAction(
  courseId: string,
  blockId: string,
  title: string | null,
): Promise<BlockMutationResult> {
  return _patchJsonBlock(
    `/courses/${encodeURIComponent(courseId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/title`,
    { title },
  );
}
