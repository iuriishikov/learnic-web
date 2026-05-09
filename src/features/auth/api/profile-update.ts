'use server';

import { apiFetch } from '@/shared/api/client';

import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from '../model/profile-update';
import type { AuthError, FieldName } from '../model/types';
import { parseFieldError, safeErrorMessage } from './_shared';

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: AuthError };

type ChangedFields = Partial<ProfileUpdateInput>;

function diffProfile(
  next: ProfileUpdateInput,
  prev: ProfileUpdateInput,
): ChangedFields {
  const out: ChangedFields = {};
  if (next.firstName !== prev.firstName) out.firstName = next.firstName;
  if (next.lastName !== prev.lastName) out.lastName = next.lastName;
  if (next.patronymic !== prev.patronymic) out.patronymic = next.patronymic;
  if (next.description !== prev.description) out.description = next.description;
  return out;
}

const FIELD_TO_ENDPOINT: Record<keyof ChangedFields, string> = {
  firstName: '/users/me/first-name',
  lastName: '/users/me/last-name',
  patronymic: '/users/me/patronymic',
  description: '/users/me/description',
};

const FIELD_NULLABLE: Record<keyof ChangedFields, boolean> = {
  firstName: false,
  lastName: false,
  patronymic: true,
  description: true,
};

async function putField(
  field: keyof ChangedFields,
  value: string,
): Promise<UpdateProfileResult> {
  const path = FIELD_TO_ENDPOINT[field];
  // Optional fields collapse the empty string to null per backend convention.
  const payloadValue =
    FIELD_NULLABLE[field] && value.trim() === '' ? null : value;
  try {
    const res = await apiFetch(path, {
      method: 'PUT',
      body: { value: payloadValue },
    });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) {
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    if (res.status === 422) {
      const { error } = await parseFieldError(res);
      // Annotate field if backend didn't.
      if (error.kind === 'validation' && !error.fields) {
        return {
          ok: false,
          error: {
            kind: 'validation',
            fields: { [field as FieldName]: 'invalid' },
          },
        };
      }
      return { ok: false, error };
    }
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function updateProfileAction(
  next: unknown,
  prev: ProfileUpdateInput,
): Promise<UpdateProfileResult> {
  const parsed = profileUpdateSchema.safeParse(next);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'validation' } };
  }

  const changed = diffProfile(parsed.data, prev);
  const fields = Object.keys(changed) as Array<keyof ChangedFields>;
  if (fields.length === 0) return { ok: true };

  for (const field of fields) {
    const result = await putField(field, changed[field] as string);
    if (!result.ok) return result;
  }
  return { ok: true };
}
