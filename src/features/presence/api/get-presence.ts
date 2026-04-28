'use server';

import { apiFetch } from '@/shared/api/client';

import {
  toUserPresence,
  type UserPresence,
  type UserPresenceResponse,
} from '../model/types';

export type GetPresenceResult =
  | { ok: true; presence: UserPresence }
  | { ok: false; error: 'invalidToken' | 'notFound' | 'network' | 'unknown' };

export async function getUserPresenceAction(
  userId: string,
): Promise<GetPresenceResult> {
  try {
    const res = await apiFetch(`/presence/${encodeURIComponent(userId)}`, {
      method: 'GET',
    });
    if (res.status === 200) {
      const raw = (await res.json()) as UserPresenceResponse;
      return { ok: true, presence: toUserPresence(raw) };
    }
    if (res.status === 401) return { ok: false, error: 'invalidToken' };
    if (res.status === 404) return { ok: false, error: 'notFound' };
    return { ok: false, error: 'unknown' };
  } catch {
    return { ok: false, error: 'network' };
  }
}
