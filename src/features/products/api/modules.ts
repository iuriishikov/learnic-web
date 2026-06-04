'use server';

import { apiFetch } from '@/shared/api/client';

import {
  type CreatedResult,
  type MutationResult,
  conflictResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

export async function addNoteModuleAction(args: {
  noteId: string;
  title: string;
  description?: string | null;
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules`,
      {
        method: 'POST',
        body: {
          title: args.title,
          ...(args.description !== undefined
            ? { description: args.description }
            : {}),
        },
      },
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

export async function renameNoteModuleAction(args: {
  noteId: string;
  moduleId: string;
  title: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules/${encodeURIComponent(args.moduleId)}/title`,
      { method: 'PATCH', body: { title: args.title } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function updateNoteModuleDescriptionAction(args: {
  noteId: string;
  moduleId: string;
  description: string | null;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules/${encodeURIComponent(args.moduleId)}/description`,
      { method: 'PATCH', body: { description: args.description } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteNoteModuleAction(args: {
  noteId: string;
  moduleId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules/${encodeURIComponent(args.moduleId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function reorderNoteModulesAction(args: {
  noteId: string;
  orderedIds: string[];
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/modules/order`,
      { method: 'PUT', body: { ordered_ids: args.orderedIds } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}
