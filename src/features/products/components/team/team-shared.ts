/**
 * Display helpers for the team UI. Pure presentation — no business logic,
 * no mock data, no API. Lives here because it's shared across the team
 * sub-components only.
 */

import { OWNER_POSITION } from '../../model/team';
import type {
  Collaboration,
  Permission,
  Role,
} from '../../model/team';

export const ROLE_COLORS = [
  'brand',
  'sky',
  'emerald',
  'amber',
  'rose',
  'violet',
] as const;
export type RoleColor = (typeof ROLE_COLORS)[number];

/** Stable color for a role: deterministic hash over the role id. */
export function colorForRole(role: Pick<Role, 'id'>): RoleColor {
  let hash = 0;
  for (let i = 0; i < role.id.length; i++) {
    hash = (hash * 31 + role.id.charCodeAt(i)) >>> 0;
  }
  return ROLE_COLORS[hash % ROLE_COLORS.length]!;
}

/** Tailwind class bundles for a role color. Pre-composed so JIT can detect them. */
export function roleColorClasses(color: RoleColor): {
  bg: string;
  bgSoft: string;
  text: string;
  ring: string;
  dot: string;
} {
  switch (color) {
    case 'brand':
      return {
        bg: 'bg-brand',
        bgSoft: 'bg-brand/10',
        text: 'text-brand',
        ring: 'ring-brand/30',
        dot: 'bg-brand',
      };
    case 'sky':
      return {
        bg: 'bg-sky-500',
        bgSoft: 'bg-sky-500/10',
        text: 'text-sky-600 dark:text-sky-400',
        ring: 'ring-sky-500/30',
        dot: 'bg-sky-500',
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-500',
        bgSoft: 'bg-emerald-500/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        ring: 'ring-emerald-500/30',
        dot: 'bg-emerald-500',
      };
    case 'amber':
      return {
        bg: 'bg-amber-500',
        bgSoft: 'bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-400',
        ring: 'ring-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'rose':
      return {
        bg: 'bg-rose-500',
        bgSoft: 'bg-rose-500/10',
        text: 'text-rose-600 dark:text-rose-400',
        ring: 'ring-rose-500/30',
        dot: 'bg-rose-500',
      };
    case 'violet':
      return {
        bg: 'bg-violet-500',
        bgSoft: 'bg-violet-500/10',
        text: 'text-violet-600 dark:text-violet-400',
        ring: 'ring-violet-500/30',
        dot: 'bg-violet-500',
      };
  }
}

/** Days until an ISO date, or `null` if no date. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

/** Pick the active product-scope grant from a collaboration's grants list,
 *  falling back to the first grant. We model "one collaborator → one role". */
export function primaryGrant<G extends { scopeType: string }>(
  grants: ReadonlyArray<G>,
): G | undefined {
  return grants.find((g) => g.scopeType === 'product') ?? grants[0];
}

export function emailHandle(email: string): string {
  const at = email.indexOf('@');
  return at === -1 ? email : email.slice(0, at);
}

export type PermissionGroupTone = 'full' | 'partial' | 'none';

export function permissionGroupTone(
  selectedCount: number,
  totalInGroup: number,
): PermissionGroupTone {
  if (totalInGroup === 0) return 'none';
  if (selectedCount === totalInGroup) return 'full';
  if (selectedCount > 0) return 'partial';
  return 'none';
}

export function isPermissionInRole(
  role: Pick<Role, 'permissions'>,
  perm: Permission,
): boolean {
  return role.permissions.includes(perm);
}

/* ----------------------------- hierarchy --------------------------------- */

/** Effective rank of a collaboration's holder, derived from its grants.
 *  ``Infinity`` is returned when no product-scope grant is present (e.g.
 *  module-only access) so any actor with rank can manage them. */
export function collaborationPosition(
  c: Pick<Collaboration, 'grants'>,
  rolesById: ReadonlyMap<string, Pick<Role, 'position'>>,
): number {
  let min = Number.POSITIVE_INFINITY;
  for (const g of c.grants) {
    if (g.scopeType !== 'product') continue;
    const role = rolesById.get(g.roleId);
    if (role && role.position < min) min = role.position;
  }
  return min;
}

/** Strict "actor outranks target" check matching the backend rule. */
export function canActOnPosition(
  myPosition: number | null,
  targetPosition: number,
): boolean {
  if (myPosition === null) return false;
  if (myPosition === OWNER_POSITION) return true;
  return myPosition < targetPosition;
}

/** Filter roles to those the actor is allowed to assign. */
export function assignableRoles<R extends Pick<Role, 'position'>>(
  roles: ReadonlyArray<R>,
  myPosition: number | null,
): R[] {
  if (myPosition === null) return [];
  if (myPosition === OWNER_POSITION) return roles.slice();
  return roles.filter((r) => r.position > myPosition);
}

export function hasPermission(
  perms: ReadonlyArray<Permission> | undefined,
  perm: Permission,
): boolean {
  return perms?.includes(perm) ?? false;
}
