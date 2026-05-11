'use server';

import { apiFetch } from '@/shared/api/client';

import type { UserExperience } from '../model/types';
import {
  type CreatedResult,
  type MutationResult,
  type UserExperienceSchemaResponse,
  fromUserExperienceSchema,
  mapMutationStatus,
  safeJson,
} from './_shared';

export type ListUserExperiencesResult =
  | { ok: true; entries: UserExperience[] }
  | { ok: false; reason: 'network' | 'unauthorized' | 'not-found' | 'unknown' };

export async function listUserExperiencesAction(
  userId: string,
): Promise<ListUserExperiencesResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/${encodeURIComponent(userId)}/experiences`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 200) {
    const raw = (await res.json()) as UserExperienceSchemaResponse[];
    return { ok: true, entries: raw.map(fromUserExperienceSchema) };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  return { ok: false, reason: 'unknown' };
}

type AddInput = {
  title: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  sourceUrl: string | null;
};

export async function addUserExperienceAction(
  input: AddInput,
): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch('/users/me/experiences', {
      method: 'POST',
      body: {
        title: input.title,
        start_date: input.startDate,
        end_date: input.endDate,
        description: input.description,
        source_url: input.sourceUrl,
      },
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

type UpdateInput = AddInput;

export async function updateUserExperienceAction(
  experienceId: string,
  input: UpdateInput,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/me/experiences/${encodeURIComponent(experienceId)}`,
      {
        method: 'PUT',
        body: {
          title: input.title,
          start_date: input.startDate,
          end_date: input.endDate,
          description: input.description,
          source_url: input.sourceUrl,
        },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteUserExperienceAction(
  experienceId: string,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/me/experiences/${encodeURIComponent(experienceId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function uploadUserExperienceIconAction(
  experienceId: string,
  formData: FormData,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/me/experiences/${encodeURIComponent(experienceId)}/icon`,
      { method: 'POST', body: formData },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteUserExperienceIconAction(
  experienceId: string,
): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/me/experiences/${encodeURIComponent(experienceId)}/icon`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}
