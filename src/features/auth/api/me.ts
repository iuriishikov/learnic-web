'use server';

import { apiFetch } from '@/shared/api/client';

import type { AuthError } from '../model/types';
import { toUser, type User, type UserResponse } from '../model/user';
import { safeErrorMessage } from './_shared';

export type GetMeResult =
  | { ok: true; user: User }
  | { ok: false; error: AuthError };

export async function getMeAction(): Promise<GetMeResult> {
  try {
    const res = await apiFetch('/auth/me', { method: 'GET' });
    if (res.status === 200) {
      const raw = (await res.json()) as UserResponse;
      return { ok: true, user: toUser(raw) };
    }
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    if (res.status === 404) {
      return { ok: false, error: { kind: 'unknown', message: 'EntityNotFound' } };
    }
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
