'use server';

import { apiFetch } from '@/shared/api/client';

import { registerSchema } from '../model/registration';
import type { AuthResult } from '../model/types';
import { parseFieldError, safeErrorMessage } from './_shared';

export async function registerAction(input: unknown): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'validation' } };
  }

  try {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        ...(parsed.data.patronymic.length > 0
          ? { patronymic: parsed.data.patronymic }
          : {}),
      },
    });

    if (res.status === 201 || res.status === 204) return { ok: true };
    if (res.status === 409) {
      return { ok: false, error: { kind: 'emailTaken' } };
    }
    if (res.status === 422) {
      const { error } = await parseFieldError(res);
      return { ok: false, error };
    }
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
