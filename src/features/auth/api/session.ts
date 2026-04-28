'use server';

import { apiFetch } from '@/shared/api/client';

import type { AuthResult } from '../model/types';
import { safeErrorMessage } from './_shared';

export async function refreshTokensAction(): Promise<AuthResult> {
  try {
    const res = await apiFetch('/auth/refresh', { method: 'POST' });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function logoutAction(): Promise<AuthResult> {
  try {
    const res = await apiFetch('/auth/logout', { method: 'POST' });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function logoutAllAction(): Promise<AuthResult> {
  try {
    const res = await apiFetch('/auth/logout-all', { method: 'POST' });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
