'use server';

import { apiFetch } from '@/shared/api/client';

import type { AdminUser } from '../model/types';
import { type AdminUserWire, type Result, mapAdminUser } from './_shared';

export async function listAdminsAction(args?: {
  limit?: number;
  offset?: number;
}): Promise<Result<AdminUser[]>> {
  const params = new URLSearchParams();
  params.set('offset', String(args?.offset ?? 0));
  params.set('limit', String(args?.limit ?? 20));
  try {
    const res = await apiFetch(`/users/admins?${params.toString()}`, {
      method: 'GET',
    });
    if (!res.ok) return { ok: false, reason: 'unknown' };
    const wire = (await res.json()) as AdminUserWire[];
    return { ok: true, data: wire.map(mapAdminUser) };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
