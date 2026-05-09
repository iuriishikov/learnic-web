import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/* Permissions                                                                */
/* -------------------------------------------------------------------------- */

export const PERMISSIONS = [
  'read_product',
  'comment',
  'edit_description',
  'edit_cover',
  'edit_modules',
  'edit_lessons',
  'edit_qa',
  'manage_releases',
  'manage_collaborators',
  'manage_roles',
  'publish',
  'archive',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export type PermissionGroupId = 'content' | 'publishing' | 'team';

export const PERMISSION_GROUPS: ReadonlyArray<{
  id: PermissionGroupId;
  permissions: ReadonlyArray<Permission>;
}> = [
  {
    id: 'content',
    permissions: [
      'read_product',
      'comment',
      'edit_description',
      'edit_cover',
      'edit_modules',
      'edit_lessons',
      'edit_qa',
    ],
  },
  {
    id: 'publishing',
    permissions: ['publish', 'archive', 'manage_releases'],
  },
  {
    id: 'team',
    permissions: ['manage_collaborators', 'manage_roles'],
  },
];

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export type Role = {
  id: string;
  productId: string;
  name: string;
  description: string | null;
  /** Discord-style hierarchy slot. Lower = higher rank. Owner has 0. */
  position: number;
  permissions: ReadonlyArray<Permission>;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Synthetic position of the product owner — outranks every real role. */
export const OWNER_POSITION = 0;

export const ROLE_PRESETS = ['blank', 'viewer', 'editor', 'admin'] as const;
export type RolePreset = (typeof ROLE_PRESETS)[number];

const VIEWER_PERMISSIONS: ReadonlyArray<Permission> = ['read_product', 'comment'];
const EDITOR_PERMISSIONS: ReadonlyArray<Permission> = [
  'read_product',
  'comment',
  'edit_description',
  'edit_cover',
  'edit_modules',
  'edit_lessons',
  'edit_qa',
];
const ADMIN_PERMISSIONS: ReadonlyArray<Permission> = PERMISSIONS;

export function presetPermissions(preset: RolePreset): ReadonlyArray<Permission> {
  switch (preset) {
    case 'blank':
      return [];
    case 'viewer':
      return VIEWER_PERMISSIONS;
    case 'editor':
      return EDITOR_PERMISSIONS;
    case 'admin':
      return ADMIN_PERMISSIONS;
  }
}

/* -------------------------------------------------------------------------- */
/* Collaborations                                                             */
/* -------------------------------------------------------------------------- */

export type ScopeType = 'product' | 'module' | 'lesson';

export type Grant = {
  id: string;
  roleId: string;
  roleName: string;
  scopeType: ScopeType;
  scopeId: string | null;
};

export type GrantSpec = {
  roleId: string;
  scopeType: ScopeType;
  scopeId: string | null;
};

export type Collaborator = {
  id: string;
  /** Privacy-masked email in the form `f*****d@domain.com`. */
  email: string;
  /** Display name in the canonical `Last First Patronymic` order. */
  fullName: string;
};

/**
 * Lightweight user projection returned by name-search.
 *
 * Mirrors the backend `UserSummarySchema` — `email` is intentionally
 * absent; the search endpoint stays privacy-respecting.
 */
export type UserSearchResult = {
  id: string;
  /** Display name in the canonical `Last First Patronymic` order. */
  fullName: string;
  avatarUrl: string | null;
};

export type CollaborationStatus = 'pending_invite' | 'active' | 'revoked';

export type Collaboration = {
  id: string;
  productId: string;
  collaborator: Collaborator | null;
  invitedEmail: string | null;
  status: CollaborationStatus;
  invitedBy: string;
  inviteExpiresAt: string | null;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  grants: ReadonlyArray<Grant>;
};

/* -------------------------------------------------------------------------- */
/* Form schemas                                                                */
/* -------------------------------------------------------------------------- */

export const ROLE_NAME_MAX = 100;
export const ROLE_DESCRIPTION_MAX = 1000;

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(ROLE_NAME_MAX),
  description: z.string().max(ROLE_DESCRIPTION_MAX).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).min(1),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const inviteByEmailSchema = z.object({
  email: z.string().trim().email().min(3).max(320),
  roleId: z.string().min(1),
});
export type InviteByEmailInput = z.infer<typeof inviteByEmailSchema>;
