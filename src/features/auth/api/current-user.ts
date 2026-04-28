import 'server-only';

import { cache } from 'react';

import { apiFetch } from '@/shared/api/client';

import { toUser, type User, type UserResponse } from '../model/user';

export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const res = await apiFetch('/auth/me', { method: 'GET' });
    if (res.status !== 200) return null;
    const raw = (await res.json()) as UserResponse;
    return toUser(raw);
  } catch {
    return null;
  }
});
