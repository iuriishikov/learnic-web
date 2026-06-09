import 'server-only';

import { apiFetch } from '@/shared/api/client';
import type { FileResponse } from '@/shared/types/user';

/** Wire shape of `GET /users/{id}` (`UserSchema` in `docs/api/openapi.json`). */
export type UserSchemaResponse = {
  oid: string;
  full_name: string;
  email: string;
  description: string | null;
  avatar: FileResponse | null;
  cover: FileResponse | null;
  // Optional in the openapi snapshot but present on the live backend.
  // Surface them when provided; treat absence as "field not set".
  is_verified?: boolean;
  website_url?: string | null;
  portfolio_url?: string | null;
  public_email?: string | null;
};

export type FetchUserResult =
  | { ok: true; user: UserSchemaResponse }
  | { ok: false; reason: 'not-found' | 'network' | 'unknown' };

export async function fetchUser(id: string): Promise<FetchUserResult> {
  let res: Response;
  try {
    res = await apiFetch(`/users/${encodeURIComponent(id)}`, { method: 'GET' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  return { ok: true, user: (await res.json()) as UserSchemaResponse };
}
