'use server';

import { apiFetch } from '@/shared/api/client';

import type { AuthResult } from '../model/types';
import { safeErrorMessage } from './_shared';

export async function uploadCoverAction(
  formData: FormData,
): Promise<AuthResult> {
  try {
    const res = await apiFetch('/users/me/cover', {
      method: 'POST',
      body: formData,
    });
    if (res.status === 200 || res.status === 201 || res.status === 204) {
      return { ok: true };
    }
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function deleteCoverAction(): Promise<AuthResult> {
  try {
    const res = await apiFetch('/users/me/cover', { method: 'DELETE' });
    if (res.status === 200 || res.status === 204) return { ok: true };
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
