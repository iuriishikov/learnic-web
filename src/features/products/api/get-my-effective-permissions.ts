import 'server-only';

import { apiFetch } from '@/shared/api/client';

import type { Permission } from '../model/team';

export type EffectivePermissions = {
  permissions: Permission[];
  hierarchyPosition: number | null;
};

export type GetMyEffectivePermissionsResult =
  | { ok: true; data: EffectivePermissions }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'not-found'
        | 'service-unavailable'
        | 'network'
        | 'unknown';
    };

export async function getMyEffectivePermissions(
  productId: string,
): Promise<GetMyEffectivePermissionsResult> {
  try {
    const res = await apiFetch(
      `/products/${encodeURIComponent(productId)}/collaborations/me/permissions`,
      { method: 'GET' },
    );
    if (res.status === 401) return { ok: false, reason: 'unauthorized' };
    if (res.status === 404) return { ok: false, reason: 'not-found' };
    if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
    if (!res.ok) return { ok: false, reason: 'unknown' };
    const raw = (await res.json()) as {
      permissions: Permission[];
      hierarchy_position: number | null;
    };
    return {
      ok: true,
      data: {
        permissions: raw.permissions,
        hierarchyPosition: raw.hierarchy_position,
      },
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
