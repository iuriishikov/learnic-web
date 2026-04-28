'use server';

import { apiFetch } from '@/shared/api/client';

import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../model/password-reset';
import type { AuthResult } from '../model/types';
import { parseFieldError, safeErrorMessage } from './_shared';

export async function requestPasswordResetAction(
  input: unknown,
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'validation' } };
  }

  try {
    const res = await apiFetch('/auth/password-reset/request', {
      method: 'POST',
      body: { email: parsed.data.email },
    });
    if (res.status === 204) return { ok: true };
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

export async function confirmPasswordResetAction(
  input: unknown,
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'validation' } };
  }

  try {
    const res = await apiFetch('/auth/password-reset/confirm', {
      method: 'POST',
      body: {
        token: parsed.data.token,
        new_password: parsed.data.password,
      },
    });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) {
      return { ok: false, error: { kind: 'invalidToken' } };
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
