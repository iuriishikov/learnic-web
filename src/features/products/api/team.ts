'use server';

import { apiFetch } from '@/shared/api/client';

import type {
  Collaboration,
  Collaborator,
  Grant,
  GrantSpec,
  Permission,
  Role,
  ScopeType,
  UserSearchResult,
} from '../model/team';

import {
  type CreatedResult,
  type MutationResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

/* -------------------------------------------------------------------------- */
/* Wire schemas                                                               */
/* -------------------------------------------------------------------------- */

type RoleSchemaResponse = {
  oid: string;
  product_id: string;
  name: string;
  description: string | null;
  position: number;
  permissions: Permission[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CollaboratorRefSchemaResponse = {
  oid: string;
  full_name: string;
  email: string;
};

type GrantSchemaResponse = {
  oid: string;
  role_id: string;
  role_name: string;
  scope_type: ScopeType;
  scope_id: string | null;
};

type CollaborationSchemaResponse = {
  oid: string;
  product_id: string;
  collaborator: CollaboratorRefSchemaResponse | null;
  invited_email: string | null;
  status: 'pending_invite' | 'active' | 'declined' | 'revoked';
  invited_by: string;
  invite_expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  grants: GrantSchemaResponse[];
};

function fromRole(raw: RoleSchemaResponse): Role {
  return {
    id: raw.oid,
    productId: raw.product_id,
    name: raw.name,
    description: raw.description,
    position: raw.position,
    permissions: raw.permissions,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function fromCollaborator(raw: CollaboratorRefSchemaResponse): Collaborator {
  return {
    id: raw.oid,
    email: raw.email,
    fullName: raw.full_name,
  };
}

function fromGrant(raw: GrantSchemaResponse): Grant {
  return {
    id: raw.oid,
    roleId: raw.role_id,
    roleName: raw.role_name,
    scopeType: raw.scope_type,
    scopeId: raw.scope_id,
  };
}

function fromCollaboration(raw: CollaborationSchemaResponse): Collaboration {
  return {
    id: raw.oid,
    productId: raw.product_id,
    collaborator: raw.collaborator ? fromCollaborator(raw.collaborator) : null,
    invitedEmail: raw.invited_email,
    status: raw.status,
    invitedBy: raw.invited_by,
    inviteExpiresAt: raw.invite_expires_at,
    createdAt: raw.created_at,
    acceptedAt: raw.accepted_at,
    declinedAt: raw.declined_at,
    revokedAt: raw.revoked_at,
    grants: raw.grants.map(fromGrant),
  };
}

function toGrantSpec(spec: GrantSpec): {
  role_id: string;
  scope_type: ScopeType;
  scope_id: string | null;
} {
  return {
    role_id: spec.roleId,
    scope_type: spec.scopeType,
    scope_id: spec.scopeId,
  };
}

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export type ListRolesResult =
  | { ok: true; roles: Role[] }
  | { ok: false; reason: 'unauthorized' | 'forbidden' | 'not-found' | 'network' | 'unknown' };

export async function listProductRolesAction(
  productId: string,
): Promise<ListRolesResult> {
  let res: Response;
  try {
    res = await apiFetch(`/products/${encodeURIComponent(productId)}/roles`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as { items: RoleSchemaResponse[] };
  return { ok: true, roles: raw.items.map(fromRole) };
}

export async function createCustomRoleAction(args: {
  productId: string;
  name: string;
  description?: string | null;
  permissions: Permission[];
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/roles`,
      {
        method: 'POST',
        body: {
          name: args.name,
          description: args.description ?? null,
          permissions: args.permissions,
        },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function updateCustomRoleAction(args: {
  roleId: string;
  name?: string | null;
  description?: string | null;
  clearDescription?: boolean;
  permissions?: Permission[] | null;
}): Promise<MutationResult> {
  const body: Record<string, unknown> = {};
  if (args.name !== undefined) body.name = args.name;
  if (args.description !== undefined) body.description = args.description;
  if (args.clearDescription !== undefined)
    body.clear_description = args.clearDescription;
  if (args.permissions !== undefined) body.permissions = args.permissions;

  let res: Response;
  try {
    res = await apiFetch(`/roles/${encodeURIComponent(args.roleId)}`, {
      method: 'PATCH',
      body,
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 409) {
    const data = await safeJson(res);
    const message = typeof data?.error === 'string' ? data.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  if (res.status === 422) {
    const data = await safeJson(res);
    const message = typeof data?.error === 'string' ? data.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function deleteCustomRoleAction(args: {
  roleId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(`/roles/${encodeURIComponent(args.roleId)}`, {
      method: 'DELETE',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 409) {
    const data = await safeJson(res);
    const message = typeof data?.error === 'string' ? data.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

/* -------------------------------------------------------------------------- */
/* Collaborations                                                             */
/* -------------------------------------------------------------------------- */

export type ListCollaborationsResult =
  | { ok: true; items: Collaboration[] }
  | { ok: false; reason: 'unauthorized' | 'forbidden' | 'not-found' | 'network' | 'unknown' };

export async function listProductCollaborationsAction(args: {
  productId: string;
  limit?: number;
  offset?: number;
}): Promise<ListCollaborationsResult> {
  const params = new URLSearchParams();
  params.set('limit', String(args.limit ?? 100));
  params.set('offset', String(args.offset ?? 0));

  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/collaborations?${params.toString()}`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as { items: CollaborationSchemaResponse[] };
  return { ok: true, items: raw.items.map(fromCollaboration) };
}

export async function inviteCollaboratorByUserAction(args: {
  productId: string;
  userId: string;
  grants: GrantSpec[];
}): Promise<CreatedResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/collaborations/by-user`,
      {
        method: 'POST',
        body: {
          user_id: args.userId,
          grants: args.grants.map(toGrantSpec),
        },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export type InviteByEmailResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
    }
  | {
      ok: false;
      reason: 'rate-limited';
      limit: number;
      retryAfterSeconds: number;
    };

export async function inviteCollaboratorByEmailAction(args: {
  productId: string;
  email: string;
  grants: GrantSpec[];
}): Promise<InviteByEmailResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(args.productId)}/collaborations/by-email`,
      {
        method: 'POST',
        body: {
          email: args.email,
          grants: args.grants.map(toGrantSpec),
        },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const body = (await res.json()) as { oid: string };
    return { ok: true, id: body.oid };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'conflict', message };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  if (res.status === 429) {
    const body = await safeJson(res);
    const limit = typeof body?.limit === 'number' ? body.limit : 0;
    const retryAfterSeconds =
      typeof body?.retry_after_seconds === 'number'
        ? body.retry_after_seconds
        : 0;
    return { ok: false, reason: 'rate-limited', limit, retryAfterSeconds };
  }
  return { ok: false, reason: 'unknown' };
}

export async function revokeCollaborationAction(args: {
  collaborationId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/collaborations/${encodeURIComponent(args.collaborationId)}`,
      { method: 'DELETE' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export async function updateCollaborationGrantsAction(args: {
  collaborationId: string;
  grants: GrantSpec[];
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/collaborations/${encodeURIComponent(args.collaborationId)}/grants`,
      {
        method: 'PUT',
        body: { grants: args.grants.map(toGrantSpec) },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

/* -------------------------------------------------------------------------- */
/* User search                                                                */
/* -------------------------------------------------------------------------- */

type UserSummarySchemaResponse = {
  oid: string;
  full_name: string;
  avatar_url: string | null;
};

function fromUserSummary(raw: UserSummarySchemaResponse): UserSearchResult {
  return {
    id: raw.oid,
    fullName: raw.full_name,
    avatarUrl: raw.avatar_url,
  };
}

export type SearchUsersResult =
  | { ok: true; users: UserSearchResult[] }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown' };

export async function searchUsersAction(args: {
  query: string;
  limit?: number;
}): Promise<SearchUsersResult> {
  const params = new URLSearchParams();
  params.set('q', args.query);
  params.set('limit', String(args.limit ?? 10));

  let res: Response;
  try {
    res = await apiFetch(`/users/search?${params.toString()}`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as UserSummarySchemaResponse[];
  return { ok: true, users: raw.map(fromUserSummary) };
}

export type EffectivePermissions = {
  permissions: Permission[];
  /** Discord-style rank: 0 for owner, positive int for collaborator,
   *  null for "no rank" (no active grant on the product). */
  hierarchyPosition: number | null;
};

export type EffectivePermissionsResult =
  | { ok: true; data: EffectivePermissions }
  | { ok: false; reason: 'unauthorized' | 'not-found' | 'network' | 'unknown' };

export async function getMyEffectivePermissionsAction(
  productId: string,
): Promise<EffectivePermissionsResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(productId)}/collaborations/me/permissions`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
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
}
