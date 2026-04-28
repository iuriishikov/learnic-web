'use server';

import { apiFetch } from '@/shared/api/client';

import { loginSchema } from '../model/login';
import type { AuthResult } from '../model/types';
import { parseFieldError, safeErrorMessage } from './_shared';

export async function loginAction(input: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'validation' } };
  }

  try {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: parsed.data,
    });

    if (res.status === 204) return { ok: true };
    if (res.status === 401) {
      return { ok: false, error: { kind: 'invalidCredentials' } };
    }
    if (res.status === 403) {
      const message = await safeErrorMessage(res);
      if (message === 'EmailNotVerified') {
        return { ok: false, error: { kind: 'emailNotVerified' } };
      }
      return { ok: false, error: { kind: 'invalidCredentials' } };
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
