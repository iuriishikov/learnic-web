'use client';

import {
  CheckCircle2Icon,
  CopyIcon,
  CrownIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { CreateRoleDialog } from './team-create-role-dialog';
import {
  ALL_PERMISSIONS,
  BUILTIN_ROLES,
  CUSTOM_ROLES,
  MOCK_MEMBERS,
  PERMISSION_GROUPS,
  type RoleColor,
  type TeamPermission,
  type TeamRole,
  roleColorClasses,
} from './team-mock';

export function TeamRolesTab() {
  const t = useTranslations('teach-products.editor.team.roles');
  const reduceMotion = useReducedMotion();
  const [roles, setRoles] = useState<TeamRole[]>([
    ...BUILTIN_ROLES,
    ...CUSTOM_ROLES,
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);

  const memberCountByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of MOCK_MEMBERS) {
      counts[m.roleId] = (counts[m.roleId] ?? 0) + 1;
    }
    return counts;
  }, []);

  const onSubmitRole = ({
    id,
    name,
    color,
    permissions,
  }: {
    id: string | null;
    name: string;
    color: RoleColor;
    permissions: ReadonlyArray<TeamPermission>;
  }) => {
    setRoles((prev) => {
      if (id) {
        return prev.map((r) =>
          r.id === id ? { ...r, name, color, permissions } : r,
        );
      }
      return [
        ...prev,
        {
          id: `role-${Date.now()}`,
          name,
          color,
          permissions,
          builtIn: false,
        },
      ];
    });
    setDialogOpen(false);
    setEditingRole(null);
  };

  const onDelete = (role: TeamRole) => {
    if (role.builtIn) return;
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
  };

  const onDuplicate = (role: TeamRole) => {
    setEditingRole({
      ...role,
      id: '',
      builtIn: false,
      name: `${role.builtIn ? roleNameBuiltIn(role.name) : role.name} · копия`,
    });
    setDialogOpen(true);
  };

  return (
    <motion.div
      key="roles-tab"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {t('tabHeading')}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('tabDescription')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingRole(null);
            setDialogOpen(true);
          }}
          className="h-9 shrink-0 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:px-4"
        >
          <PlusIcon className="size-4" />
          {t('createCta')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            memberCount={memberCountByRole[role.id] ?? 0}
            onEdit={() => {
              setEditingRole(role);
              setDialogOpen(true);
            }}
            onDuplicate={() => onDuplicate(role)}
            onDelete={() => onDelete(role)}
          />
        ))}
      </div>

      <CreateRoleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingRole(null);
        }}
        editingRole={editingRole}
        editingMemberCount={
          editingRole ? memberCountByRole[editingRole.id] ?? 0 : 0
        }
        onSubmit={onSubmitRole}
      />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Role card                                                                  */
/* -------------------------------------------------------------------------- */

function RoleCard({
  role,
  memberCount,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  role: TeamRole;
  memberCount: number;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.roles');
  const tNames = useTranslations('teach-products.editor.team.roles');
  const tPerm = useTranslations('teach-products.editor.team.permissions');
  const tone = roleColorClasses(role.color);

  const isOwner = role.id === 'owner';
  const editable = !role.builtIn;
  const totalPermissions = ALL_PERMISSIONS.length;
  const grantedCount = role.permissions.length;
  const granted = useMemo(() => new Set(role.permissions), [role.permissions]);

  const displayName = role.builtIn ? tNames(role.name) : role.name;

  return (
    <article
      className={cn(
        'group/role-card relative overflow-hidden rounded-2xl border border-border bg-background transition-all hover:border-foreground/15 hover:shadow-sm',
      )}
    >
      {/* Top color band */}
      <div className={cn('h-1.5 w-full', tone.bg)} />
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-foreground/10',
                tone.bgSoft,
              )}
            >
              {isOwner ? (
                <CrownIcon className={cn('size-4', tone.text)} />
              ) : (
                <ShieldIcon className={cn('size-4', tone.text)} />
              )}
            </span>
            <div className="flex min-w-0 flex-col">
              <h4 className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </h4>
              <span className="text-xs text-muted-foreground">
                {t('membersCount', { count: memberCount })}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                role.builtIn
                  ? 'border-border bg-muted text-muted-foreground'
                  : 'border-brand/30 bg-brand/10 text-brand',
              )}
            >
              {role.builtIn ? (
                <LockIcon className="size-2.5" />
              ) : null}
              {role.builtIn ? t('builtInLabel') : t('customLabel')}
            </span>
            <RoleMenu
              isOwner={isOwner}
              editable={editable}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          </div>
        </div>

        {/* Permissions progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-foreground">
              {isOwner
                ? t('fullAccess')
                : t('permissionsCount', { count: grantedCount })}
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {grantedCount}/{totalPermissions}
            </span>
          </div>
          <div
            aria-hidden
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
          >
            <span
              className={cn('absolute inset-y-0 left-0 rounded-full', tone.bg)}
              style={{
                width: `${
                  totalPermissions === 0
                    ? 0
                    : (grantedCount / totalPermissions) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Group breakdown — compact icons row */}
        <ul className="grid grid-cols-3 gap-1.5">
          {PERMISSION_GROUPS.map((group) => {
            const inGroup = group.permissions.length;
            const have = group.permissions.filter((p) => granted.has(p)).length;
            const fully = have === inGroup;
            const partial = have > 0 && have < inGroup;
            return (
              <li key={group.id}>
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] leading-none',
                    fully
                      ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400'
                      : partial
                        ? 'border-amber-500/30 bg-amber-500/[0.06] text-amber-700 dark:text-amber-400'
                        : 'border-border bg-muted/30 text-muted-foreground',
                  )}
                  title={`${tPerm(`groups.${group.id}`)} • ${have}/${inGroup}`}
                >
                  {fully ? (
                    <CheckCircle2Icon className="size-3 shrink-0" />
                  ) : partial ? (
                    <CheckCircle2Icon className="size-3 shrink-0" />
                  ) : (
                    <XCircleIcon className="size-3 shrink-0" />
                  )}
                  <span className="truncate font-medium">
                    {tPerm(`groups.${group.id}`)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {isOwner ? (
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs leading-snug text-muted-foreground">
            {t('ownerHint')}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function RoleMenu({
  isOwner,
  editable,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  isOwner: boolean;
  editable: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.roles');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Действия с ролью"
            className="text-muted-foreground hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="w-52">
        <DropdownMenuItem onClick={onEdit} disabled={!editable || isOwner}>
          <PencilIcon />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <CopyIcon />
          {t('duplicate')}
        </DropdownMenuItem>
        {editable && !isOwner ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              {t('delete')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Translates the i18n key stored on built-in roles ('owner'/'admin'/...). */
function roleNameBuiltIn(key: string): string {
  // We don't have a hook here; fall back to a capitalized key — used only as
  // a placeholder name when duplicating.
  return key.charAt(0).toUpperCase() + key.slice(1);
}
