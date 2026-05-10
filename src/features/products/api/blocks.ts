'use server';

import { apiFetch } from '@/shared/api/client';

import type { CodeTab } from '../model/draft';

import {
  type CreatedResult,
  type MutationResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

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

async function addBlock(
  courseId: string,
  lessonId: string,
  type: 'html' | 'katex' | 'rutube-video' | 'code',
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

async function patchBlock(
  courseId: string,
  blockId: string,
  type: 'html' | 'katex' | 'rutube-video' | 'code',
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
