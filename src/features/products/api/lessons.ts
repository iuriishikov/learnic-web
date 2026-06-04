'use server';

import { apiFetch } from '@/shared/api/client';

import {
  type CreatedResult,
  type MutationResult,
  conflictResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

export async function addNoteLessonAction(args: {
  noteId: string;
  moduleId: string;
  title: string;
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules/${encodeURIComponent(args.moduleId)}/lessons`,
      { method: 'POST', body: { title: args.title } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return conflictResult(res);
  return { ok: false, reason: 'unknown' };
}

export async function renameNoteLessonAction(args: {
  noteId: string;
  lessonId: string;
  title: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/lessons/${encodeURIComponent(args.lessonId)}/title`,
      { method: 'PATCH', body: { title: args.title } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function moveNoteLessonAction(args: {
  noteId: string;
  lessonId: string;
  targetModuleId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/lessons/${encodeURIComponent(args.lessonId)}/move`,
      { method: 'PATCH', body: { target_module_id: args.targetModuleId } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function reorderNoteLessonsAction(args: {
  noteId: string;
  moduleId: string;
  orderedIds: string[];
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules/${encodeURIComponent(args.moduleId)}/lessons/order`,
      { method: 'PUT', body: { ordered_ids: args.orderedIds } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteNoteLessonAction(args: {
  noteId: string;
  lessonId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/lessons/${encodeURIComponent(args.lessonId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}
