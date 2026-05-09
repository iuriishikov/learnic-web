'use server';

import { apiFetch } from '@/shared/api/client';

import {
  toActiveSession,
  type ActiveSession,
  type SessionResponse,
} from '../model/sessions';
import type { AuthError, AuthResult } from '../model/types';
import { safeErrorMessage } from './_shared';

export type ListActiveSessionsResult =
  | { ok: true; sessions: ActiveSession[] }
  | { ok: false; error: AuthError };

export async function listActiveSessionsAction(): Promise<ListActiveSessionsResult> {
  try {
    const res = await apiFetch('/auth/sessions', { method: 'GET' });
    if (res.status === 200) {
      const raw = (await res.json()) as SessionResponse[];
      return { ok: true, sessions: raw.map(toActiveSession) };
    }
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function revokeActiveSessionAction(
  sessionId: string,
): Promise<AuthResult> {
  if (!sessionId) return { ok: false, error: { kind: 'validation' } };
  try {
    const res = await apiFetch(
      `/auth/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' },
    );
    if (res.status === 204) return { ok: true };
    if (res.status === 401) return { ok: false, error: { kind: 'invalidToken' } };
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
