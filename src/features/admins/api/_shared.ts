import 'server-only';

import { type FileResponse, toApiFile } from '@/shared/types/user';

import type { AdminUser } from '../model/types';

export type AdminsFailReason = 'network' | 'unknown';

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: AdminsFailReason };

// --- wire shapes (snake_case, mirrored from docs/api/openapi.json) --- //

export type AdminUserWire = {
  oid: string;
  full_name: string;
  email: string;
  is_verified: boolean;
  avatar: FileResponse | null;
};

export function mapAdminUser(wire: AdminUserWire): AdminUser {
  return {
    id: wire.oid,
    fullName: wire.full_name,
    isVerified: wire.is_verified,
    avatar: wire.avatar ? toApiFile(wire.avatar) : null,
  };
}
