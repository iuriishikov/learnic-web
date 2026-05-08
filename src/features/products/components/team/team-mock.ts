/**
 * Mock data + helpers for the Team section. Stays internal to the feature
 * — not re-exported from the products `index.ts`.
 */

export type TeamPermission =
  | 'content.view'
  | 'content.edit'
  | 'content.publish'
  | 'content.reorder'
  | 'modules.create'
  | 'modules.delete'
  | 'lessons.create'
  | 'lessons.delete'
  | 'qa.manage'
  | 'members.invite'
  | 'members.remove'
  | 'members.changeRole'
  | 'releases.create'
  | 'releases.reset'
  | 'settings.edit'
  | 'settings.archive'
  | 'settings.delete'
  | 'analytics.view'
  | 'analytics.export';

export type TeamPermissionGroup =
  | 'content'
  | 'qa'
  | 'members'
  | 'releases'
  | 'settings'
  | 'analytics';

export const PERMISSION_GROUPS: ReadonlyArray<{
  id: TeamPermissionGroup;
  permissions: ReadonlyArray<TeamPermission>;
}> = [
  {
    id: 'content',
    permissions: [
      'content.view',
      'content.edit',
      'content.publish',
      'content.reorder',
      'modules.create',
      'modules.delete',
      'lessons.create',
      'lessons.delete',
    ],
  },
  { id: 'qa', permissions: ['qa.manage'] },
  {
    id: 'members',
    permissions: ['members.invite', 'members.remove', 'members.changeRole'],
  },
  { id: 'releases', permissions: ['releases.create', 'releases.reset'] },
  {
    id: 'settings',
    permissions: ['settings.edit', 'settings.archive', 'settings.delete'],
  },
  { id: 'analytics', permissions: ['analytics.view', 'analytics.export'] },
];

export const ALL_PERMISSIONS: ReadonlyArray<TeamPermission> =
  PERMISSION_GROUPS.flatMap((g) => g.permissions);

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

/** Hex-ish token reference. We swatch via tailwind `bg-${color}` not allowed
 *  with arbitrary values, so we use a fixed palette. */
export const ROLE_COLORS = [
  'brand',
  'sky',
  'emerald',
  'amber',
  'rose',
  'violet',
] as const;
export type RoleColor = (typeof ROLE_COLORS)[number];

export type TeamRoleId = string;

export type TeamRole = {
  id: TeamRoleId;
  /** Localization key for built-in role names, plain string for custom. */
  name: string;
  /** Whether the name should be looked up in the i18n catalog. */
  builtIn: boolean;
  color: RoleColor;
  permissions: ReadonlyArray<TeamPermission>;
};

const VIEWER_PERMISSIONS: ReadonlyArray<TeamPermission> = ['content.view'];
const EDITOR_PERMISSIONS: ReadonlyArray<TeamPermission> = [
  'content.view',
  'content.edit',
  'content.reorder',
  'modules.create',
  'modules.delete',
  'lessons.create',
  'lessons.delete',
  'qa.manage',
];
const ADMIN_PERMISSIONS: ReadonlyArray<TeamPermission> = ALL_PERMISSIONS.filter(
  (p) => p !== 'settings.delete',
);

export const BUILTIN_ROLES: ReadonlyArray<TeamRole> = [
  {
    id: 'owner',
    name: 'owner',
    builtIn: true,
    color: 'brand',
    permissions: ALL_PERMISSIONS,
  },
  {
    id: 'admin',
    name: 'admin',
    builtIn: true,
    color: 'violet',
    permissions: ADMIN_PERMISSIONS,
  },
  {
    id: 'editor',
    name: 'editor',
    builtIn: true,
    color: 'sky',
    permissions: EDITOR_PERMISSIONS,
  },
  {
    id: 'viewer',
    name: 'viewer',
    builtIn: true,
    color: 'emerald',
    permissions: VIEWER_PERMISSIONS,
  },
];

export const CUSTOM_ROLES: ReadonlyArray<TeamRole> = [
  {
    id: 'role-curator',
    name: 'Куратор практики',
    builtIn: false,
    color: 'amber',
    permissions: [
      'content.view',
      'content.edit',
      'qa.manage',
      'members.invite',
      'analytics.view',
    ],
  },
  {
    id: 'role-marketing',
    name: 'Маркетинг',
    builtIn: false,
    color: 'rose',
    permissions: ['content.view', 'analytics.view', 'analytics.export'],
  },
];

export const ROLE_PRESETS = ['blank', 'viewer', 'editor', 'admin'] as const;
export type RolePreset = (typeof ROLE_PRESETS)[number];

export function presetPermissions(
  preset: RolePreset,
): ReadonlyArray<TeamPermission> {
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
/* Members                                                                    */
/* -------------------------------------------------------------------------- */

export type TeamStatus = 'active' | 'offline' | 'invited';

export type TeamMember = {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarUrl?: string;
  status: TeamStatus;
  roleId: TeamRoleId;
  joinedAt: string;
  lastActiveMinutes: number;
};

export const MOCK_MEMBERS: ReadonlyArray<TeamMember> = [
  {
    id: '1',
    name: 'Olivia Rhye',
    handle: 'olivia',
    email: 'olivia@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=47',
    status: 'active',
    roleId: 'owner',
    joinedAt: '2024-03-12',
    lastActiveMinutes: 2,
  },
  {
    id: '2',
    name: 'Феникс Бейкер',
    handle: 'phoenix',
    email: 'phoenix@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=12',
    status: 'active',
    roleId: 'admin',
    joinedAt: '2024-04-02',
    lastActiveMinutes: 8,
  },
  {
    id: '3',
    name: 'Лана Штайнер',
    handle: 'lana',
    email: 'lana@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=32',
    status: 'offline',
    roleId: 'editor',
    joinedAt: '2024-05-19',
    lastActiveMinutes: 60 * 8,
  },
  {
    id: '4',
    name: 'Деми Уилкинсон',
    handle: 'demi',
    email: 'demi@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=45',
    status: 'active',
    roleId: 'editor',
    joinedAt: '2024-06-08',
    lastActiveMinutes: 22,
  },
  {
    id: '5',
    name: 'Кэндис Ву',
    handle: 'candice',
    email: 'candice@learnic.io',
    status: 'offline',
    roleId: 'viewer',
    joinedAt: '2024-07-20',
    lastActiveMinutes: 60 * 24 * 3,
  },
  {
    id: '6',
    name: 'Натали Крейг',
    handle: 'natali',
    email: 'natali@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=24',
    status: 'active',
    roleId: 'role-curator',
    joinedAt: '2024-08-04',
    lastActiveMinutes: 1,
  },
  {
    id: '7',
    name: 'Дрю Кано',
    handle: 'drew',
    email: 'drew@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=15',
    status: 'active',
    roleId: 'admin',
    joinedAt: '2024-08-30',
    lastActiveMinutes: 14,
  },
  {
    id: '8',
    name: 'Орландо Диггс',
    handle: 'orlando',
    email: 'orlando@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=68',
    status: 'active',
    roleId: 'editor',
    joinedAt: '2024-09-11',
    lastActiveMinutes: 5,
  },
  {
    id: '9',
    name: 'Анна Морозова',
    handle: 'anna',
    email: 'anna@learnic.io',
    status: 'invited',
    roleId: 'editor',
    joinedAt: '2026-04-28',
    lastActiveMinutes: 60 * 24 * 7,
  },
  {
    id: '10',
    name: 'Игорь Светлов',
    handle: 'igor',
    email: 'igor@learnic.io',
    status: 'invited',
    roleId: 'role-marketing',
    joinedAt: '2026-05-01',
    lastActiveMinutes: 60 * 24 * 7,
  },
  {
    id: '11',
    name: 'Софья Климова',
    handle: 'sofya',
    email: 'sofya@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=9',
    status: 'offline',
    roleId: 'viewer',
    joinedAt: '2024-10-22',
    lastActiveMinutes: 60 * 24 * 12,
  },
  {
    id: '12',
    name: 'Максим Гордеев',
    handle: 'max',
    email: 'max@learnic.io',
    avatarUrl: 'https://i.pravatar.cc/96?img=53',
    status: 'invited',
    roleId: 'admin',
    joinedAt: '2026-05-05',
    lastActiveMinutes: 60 * 48,
  },
];

/* -------------------------------------------------------------------------- */
/* Pending invitations                                                        */
/* -------------------------------------------------------------------------- */

export type PendingInvitation = {
  id: string;
  email: string;
  roleId: TeamRoleId;
  invitedByName: string;
  invitedByAvatarUrl?: string;
  sentAt: string;
  /** Days remaining until the invite link expires. */
  expiresInDays: number;
};

export const MOCK_INVITATIONS: ReadonlyArray<PendingInvitation> = [
  {
    id: 'inv-1',
    email: 'anna@learnic.io',
    roleId: 'editor',
    invitedByName: 'Olivia Rhye',
    invitedByAvatarUrl: 'https://i.pravatar.cc/96?img=47',
    sentAt: '2026-04-28',
    expiresInDays: 5,
  },
  {
    id: 'inv-2',
    email: 'igor@learnic.io',
    roleId: 'role-marketing',
    invitedByName: 'Феникс Бейкер',
    invitedByAvatarUrl: 'https://i.pravatar.cc/96?img=12',
    sentAt: '2026-05-01',
    expiresInDays: 8,
  },
  {
    id: 'inv-3',
    email: 'max@learnic.io',
    roleId: 'admin',
    invitedByName: 'Olivia Rhye',
    invitedByAvatarUrl: 'https://i.pravatar.cc/96?img=47',
    sentAt: '2026-05-05',
    expiresInDays: 1,
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : '';
  return (first + last).toUpperCase();
}

/** Returns the Tailwind color tokens used for a role swatch. We pre-compose
 *  the strings so Tailwind's JIT can statically detect them. */
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
