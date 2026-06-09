'use server';

import { apiFetch } from '@/shared/api/client';

import type {
  CodeTab,
  FunctionGraphConfig,
  LessonBlock,
} from '../model/draft';
import {
  fromBlockResponse,
  type LessonBlockResponse,
} from '../lib/draft-wire';
import { toConfigWire } from '../lib/function-graph-config';

import {
  type BlockMutationResult,
  type CreatedResult,
  type MutationResult,
  conflictResult,
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
  noteId: string;
  lessonId: string;
  html: string;
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'html', { html: args.html });
}

export async function addKatexBlockAction(args: {
  noteId: string;
  lessonId: string;
  source: string;
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'katex', {
    source: args.source,
  });
}

export async function addRutubeVideoBlockAction(args: {
  noteId: string;
  lessonId: string;
  rutubeUrl: string;
  title: string | null;
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'rutube-video', {
    rutube_url: args.rutubeUrl,
    title: args.title,
  });
}

export async function addCodeBlockAction(args: {
  noteId: string;
  lessonId: string;
  tabs: CodeTab[];
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'code', {
    tabs: args.tabs,
  });
}

export async function addFunctionGraphBlockAction(args: {
  noteId: string;
  lessonId: string;
  config: FunctionGraphConfig;
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'function-graph', {
    config: toConfigWire(args.config),
  });
}

export async function addSingleChoiceBlockAction(args: {
  noteId: string;
  lessonId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'single-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function addMultiChoiceBlockAction(args: {
  noteId: string;
  lessonId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'multi-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function addTextInputBlockAction(args: {
  noteId: string;
  lessonId: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
}): Promise<CreatedResult> {
  return addBlock(args.noteId, args.lessonId, 'text-input', {
    accepted_answers: args.acceptedAnswers,
    case_sensitive: args.caseSensitive,
    trim_whitespace: args.trimWhitespace,
  });
}

async function addBlock(
  noteId: string,
  lessonId: string,
  type:
    | 'html'
    | 'katex'
    | 'rutube-video'
    | 'code'
    | 'function-graph'
    | 'single-choice'
    | 'multi-choice'
    | 'text-input',
  body: Record<string, unknown>,
): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/lessons/${encodeURIComponent(lessonId)}/blocks/${type}`,
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
  if (res.status === 409) return conflictResult(res);
  return { ok: false, reason: 'unknown' };
}

export async function updateHtmlBlockAction(args: {
  noteId: string;
  blockId: string;
  html: string;
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'html', { html: args.html });
}

export async function updateKatexBlockAction(args: {
  noteId: string;
  blockId: string;
  source: string;
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'katex', {
    source: args.source,
  });
}

export async function updateRutubeVideoBlockAction(args: {
  noteId: string;
  blockId: string;
  rutubeUrl: string;
  title: string | null;
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'rutube-video', {
    rutube_url: args.rutubeUrl,
    title: args.title,
  });
}

export async function updateCodeBlockAction(args: {
  noteId: string;
  blockId: string;
  tabs: CodeTab[];
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'code', {
    tabs: args.tabs,
  });
}

export async function updateFunctionGraphBlockAction(args: {
  noteId: string;
  blockId: string;
  config: FunctionGraphConfig;
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'function-graph', {
    config: toConfigWire(args.config),
  });
}

export async function updateSingleChoiceBlockAction(args: {
  noteId: string;
  blockId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'single-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function updateMultiChoiceBlockAction(args: {
  noteId: string;
  blockId: string;
  options: ChoiceOptionDraftInput[];
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'multi-choice', {
    options: _toOptionsWire(args.options),
  });
}

export async function updateTextInputBlockAction(args: {
  noteId: string;
  blockId: string;
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
}): Promise<MutationResult> {
  return patchBlock(args.noteId, args.blockId, 'text-input', {
    accepted_answers: args.acceptedAnswers,
    case_sensitive: args.caseSensitive,
    trim_whitespace: args.trimWhitespace,
  });
}

async function patchBlock(
  noteId: string,
  blockId: string,
  type:
    | 'html'
    | 'katex'
    | 'rutube-video'
    | 'code'
    | 'function-graph'
    | 'single-choice'
    | 'multi-choice'
    | 'text-input',
  body: Record<string, unknown>,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/${type}`,
      { method: 'PATCH', body },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function reorderLessonBlocksAction(args: {
  noteId: string;
  lessonId: string;
  orderedIds: string[];
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/lessons/${encodeURIComponent(args.lessonId)}/blocks/order`,
      { method: 'PUT', body: { ordered_ids: args.orderedIds } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteLessonBlockAction(args: {
  noteId: string;
  blockId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/blocks/${encodeURIComponent(args.blockId)}`,
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
// note-draft cache, skipping a follow-up GET. Error responses still
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
  noteId: string,
  lessonId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/notes/${encodeURIComponent(noteId)}/lessons/${encodeURIComponent(lessonId)}/blocks/file`,
    formData,
  );
}

export async function updateFileBlockAction(
  noteId: string,
  blockId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _patchMultipartBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/file`,
    formData,
  );
}

export async function addVideoFileBlockAction(
  noteId: string,
  lessonId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/notes/${encodeURIComponent(noteId)}/lessons/${encodeURIComponent(lessonId)}/blocks/video-file`,
    formData,
  );
}

export async function updateVideoFileBlockAction(
  noteId: string,
  blockId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _patchMultipartBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/video-file`,
    formData,
  );
}

export async function addPhotoCollageBlockAction(
  noteId: string,
  lessonId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/notes/${encodeURIComponent(noteId)}/lessons/${encodeURIComponent(lessonId)}/blocks/photo-collage`,
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
  noteId: string,
  blockId: string,
  formData: FormData,
): Promise<BlockMutationResult> {
  return _postMultipartBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items`,
    formData,
  );
}

export async function removeCollageItemAction(
  noteId: string,
  blockId: string,
  itemId: string,
): Promise<BlockMutationResult> {
  return _deleteBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items/${encodeURIComponent(itemId)}`,
  );
}

export async function reorderCollageItemsAction(
  noteId: string,
  blockId: string,
  orderedIds: string[],
): Promise<BlockMutationResult> {
  return _putJsonBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items/order`,
    { ordered_ids: orderedIds },
  );
}

export async function updateCollageItemCaptionAction(
  noteId: string,
  blockId: string,
  itemId: string,
  caption: string | null,
): Promise<BlockMutationResult> {
  return _patchJsonBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/items/${encodeURIComponent(itemId)}/caption`,
    { caption },
  );
}

export async function updateCollageTitleAction(
  noteId: string,
  blockId: string,
  title: string | null,
): Promise<BlockMutationResult> {
  return _patchJsonBlock(
    `/notes/${encodeURIComponent(noteId)}/blocks/${encodeURIComponent(blockId)}/photo-collage/title`,
    { title },
  );
}
