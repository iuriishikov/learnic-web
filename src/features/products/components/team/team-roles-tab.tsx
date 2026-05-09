'use client';

import {
  CheckCircle2Icon,
  PencilIcon,
  PlusIcon,
  RotateCwIcon,
  ShieldIcon,
  Sparkles,
  Trash2Icon,
  XCircleIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';

import { useProductPermissions } from '../../api/use-product-permissions';
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useMyEffectivePermissions,
  useProductCollaborations,
  useProductRoles,
  useUpdateRoleMutation,
} from '../../api/use-team';
import {
  OWNER_POSITION,
  PERMISSION_GROUPS,
  PERMISSIONS,
  type Permission,
  type Role,
} from '../../model/team';

import { CreateRoleDialog } from './team-create-role-dialog';
import {
  colorForRole,
  primaryGrant,
  roleColorClasses,
} from './team-shared';

/* -------------------------------------------------------------------------- */
/* Suggested role bootstrap                                                   */
/* -------------------------------------------------------------------------- */

type SuggestedRoleId = 'editor' | 'commentor';

const SUGGESTED_ROLES: ReadonlyArray<{
  id: SuggestedRoleId;
  permissions: ReadonlyArray<Permission>;
}> = [
  // Order matters: created in sequence, the first one slots at the
  // highest rank (lowest position) — Editor outranks Commentor.
  {
    id: 'editor',
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
    id: 'commentor',
    permissions: ['read_product', 'comment'],
  },
];

/* -------------------------------------------------------------------------- */
/* Roles tab                                                                  */
/* -------------------------------------------------------------------------- */

export function TeamRolesTab({ productId }: { productId: string }) {
  const t = useTranslations('teach-products.editor.team.roles');
  const tLoad = useTranslations('teach-products.editor.team.load');
  const tEditor = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();

  const rolesQuery = useProductRoles(productId);
  const collabsQuery = useProductCollaborations(productId);
  const myPerms = useMyEffectivePermissions(productId);
  const perms = useProductPermissions(productId);
  const canManageRoles = perms.canManageRoles;
  const insufficientTitle = tEditor('insufficientPermissions');

  const createRole = useCreateRoleMutation(productId);
  const updateRole = useUpdateRoleMutation(productId);
  const deleteRole = useDeleteRoleMutation(productId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const roles = rolesQuery.data ?? [];

  const memberCountByRole = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!collabsQuery.data) return counts;
    for (const c of collabsQuery.data) {
      if (c.status !== 'active') continue;
      const grant = primaryGrant(c.grants);
      if (!grant) continue;
      counts[grant.roleId] = (counts[grant.roleId] ?? 0) + 1;
    }
    return counts;
  }, [collabsQuery.data]);

  // Onboarding modal: appears when the product author lands on an
  // empty Team tab. The state is derived from the data — once the
  // author creates at least one role (via the suggested set or
  // manually) the condition stops being true and the modal disappears.
  // No backend flag persists — the empty role list IS the signal.
  const isAuthor = myPerms.data?.hierarchyPosition === OWNER_POSITION;
  const showOnboarding =
    !rolesQuery.isPending &&
    !rolesQuery.isError &&
    isAuthor &&
    roles.length === 0;
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const onboardingShownRef = useRef(false);
  useEffect(() => {
    if (showOnboarding && !onboardingShownRef.current) {
      onboardingShownRef.current = true;
      setOnboardingOpen(true);
    }
    if (!showOnboarding) {
      onboardingShownRef.current = false;
    }
  }, [showOnboarding]);

  const onSubmitRole = ({
    id,
    name,
    permissions,
  }: {
    id: string | null;
    name: string;
    permissions: ReadonlyArray<Permission>;
  }) => {
    const perms = permissions.slice() as Permission[];
    if (id) {
      updateRole.mutate(
        { roleId: id, name, permissions: perms },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingRole(null);
          },
        },
      );
      return;
    }
    createRole.mutate(
      { name, permissions: perms },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingRole(null);
        },
      },
    );
  };

  const onDelete = (role: Role) => {
    deleteRole.mutate({ roleId: role.id });
  };

  const dialogPending = editingRole ? updateRole.isPending : createRole.isPending;

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
          disabled={rolesQuery.isError || !canManageRoles}
          title={!canManageRoles ? insufficientTitle : undefined}
          className="h-9 shrink-0 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:px-4"
        >
          <PlusIcon className="size-4" />
          {t('createCta')}
        </Button>
      </div>

      {rolesQuery.isPending ? (
        <RolesSkeleton />
      ) : rolesQuery.isError ? (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-6 sm:items-center sm:text-center"
        >
          <h4 className="font-heading text-base font-semibold tracking-tight text-foreground">
            {tLoad('errorTitle')}
          </h4>
          <p className="max-w-md text-sm leading-snug text-muted-foreground">
            {tLoad('rolesErrorDescription')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => rolesQuery.refetch()}
            disabled={rolesQuery.isFetching}
            className="h-8 gap-1.5"
          >
            <RotateCwIcon
              className={cn('size-3.5', rolesQuery.isFetching && 'animate-spin')}
            />
            {tLoad('retry')}
          </Button>
        </div>
      ) : roles.length === 0 ? (
        <EmptyRolesState
          canManage={isAuthor && canManageRoles}
          onOpenOnboarding={() => setOnboardingOpen(true)}
          onCreateCustom={() => {
            setEditingRole(null);
            setDialogOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              memberCount={memberCountByRole[role.id] ?? 0}
              canManageRoles={canManageRoles}
              insufficientTitle={insufficientTitle}
              onEdit={() => {
                setEditingRole(role);
                setDialogOpen(true);
              }}
              onDelete={() => onDelete(role)}
              deleting={deleteRole.isPending && deleteRole.variables?.roleId === role.id}
            />
          ))}
        </div>
      )}

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
        pending={dialogPending}
        onSubmit={onSubmitRole}
      />

      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        creating={createRole.isPending}
        onCreateSuggested={async () => {
          // Sequential creation so the position-bottom rule slots
          // them in the order we want — Editor first (highest rank),
          // then Commentor (one rank below).
          for (const suggestion of SUGGESTED_ROLES) {
            await createRole.mutateAsync({
              name: t(`onboarding.suggested.${suggestion.id}.name`),
              description: t(
                `onboarding.suggested.${suggestion.id}.description`,
              ),
              permissions: suggestion.permissions.slice() as Permission[],
            });
          }
          setOnboardingOpen(false);
        }}
        onCreateCustom={() => {
          setOnboardingOpen(false);
          setEditingRole(null);
          setDialogOpen(true);
        }}
      />
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyRolesState({
  canManage,
  onOpenOnboarding,
  onCreateCustom,
}: {
  canManage: boolean;
  onOpenOnboarding: () => void;
  onCreateCustom: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.roles');
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/20">
        <ShieldIcon className="size-5" aria-hidden />
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <h4 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {t('empty.title')}
        </h4>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('empty.description')}
        </p>
      </div>
      {canManage ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={onOpenOnboarding}
            className="h-9 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90"
          >
            <Sparkles className="size-4" aria-hidden />
            {t('empty.suggestedCta')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCreateCustom}
            className="h-9 gap-1.5 px-3"
          >
            <PlusIcon className="size-4" aria-hidden />
            {t('empty.customCta')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Onboarding dialog                                                          */
/* -------------------------------------------------------------------------- */

function OnboardingDialog({
  open,
  onOpenChange,
  creating,
  onCreateSuggested,
  onCreateCustom,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creating: boolean;
  onCreateSuggested: () => void;
  onCreateCustom: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.roles.onboarding');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[480px]">
        <DialogHeader className="px-6 pt-6 pb-3 text-left">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 ring-1 ring-brand/15">
              <Sparkles className="size-[18px] text-brand" aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle className="text-[15px] font-semibold tracking-tight">
                {t('title')}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-snug text-muted-foreground">
                {t('description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 px-6 pt-1 pb-4">
          <ul className="flex flex-col gap-2">
            {SUGGESTED_ROLES.map((suggestion) => (
              <li
                key={suggestion.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
                  <ShieldIcon className="size-3.5" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {t(`suggested.${suggestion.id}.name`)}
                  </span>
                  <span className="text-xs leading-snug text-muted-foreground">
                    {t(`suggested.${suggestion.id}.description`)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-snug text-muted-foreground">
            {t('hint')}
          </p>
        </div>

        <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border bg-muted/20 px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCreateCustom}
            disabled={creating}
            className="h-9 px-4 text-sm"
          >
            {t('customCta')}
          </Button>
          <Button
            type="button"
            onClick={onCreateSuggested}
            disabled={creating}
            className="h-9 gap-1.5 bg-brand px-4 text-sm text-brand-foreground hover:bg-brand/90"
          >
            <Sparkles className="size-4" aria-hidden />
            {creating ? t('creating') : t('suggestedCta')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Role card                                                                  */
/* -------------------------------------------------------------------------- */

function RoleCard({
  role,
  memberCount,
  canManageRoles,
  insufficientTitle,
  onEdit,
  onDelete,
  deleting,
}: {
  role: Role;
  memberCount: number;
  canManageRoles: boolean;
  insufficientTitle: string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const t = useTranslations('teach-products.editor.team.roles');
  const tPerm = useTranslations('teach-products.editor.team.permissions');
  const tone = roleColorClasses(colorForRole(role));

  const totalPermissions = PERMISSIONS.length;
  const grantedCount = role.permissions.length;
  const granted = useMemo(() => new Set(role.permissions), [role.permissions]);

  return (
    <article
      className={cn(
        'group/role-card relative overflow-hidden rounded-2xl border border-border bg-background transition-all hover:border-foreground/15 hover:shadow-sm',
        deleting && 'opacity-60',
      )}
    >
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
              <ShieldIcon className={cn('size-4', tone.text)} />
            </span>
            <div className="flex min-w-0 flex-col">
              <h4 className="truncate text-sm font-semibold text-foreground">
                {role.name}
              </h4>
              <span className="text-xs text-muted-foreground">
                {t('membersCount', { count: memberCount })}
              </span>
            </div>
          </div>
          <RoleMenu
            canManageRoles={canManageRoles}
            insufficientTitle={insufficientTitle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>

        {/* Permissions progress */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-foreground">
              {grantedCount === totalPermissions
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
                width: `${(grantedCount / totalPermissions) * 100}%`,
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
                  {fully || partial ? (
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
      </div>
    </article>
  );
}

function RoleMenu({
  canManageRoles,
  insufficientTitle,
  onEdit,
  onDelete,
}: {
  canManageRoles: boolean;
  insufficientTitle: string;
  onEdit: () => void;
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
            aria-label={t('rowMenu')}
            className="text-muted-foreground hover:text-foreground"
          >
            <PencilIcon className="size-3.5" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="w-52">
        <DropdownMenuItem
          onClick={onEdit}
          disabled={!canManageRoles}
          title={!canManageRoles ? insufficientTitle : undefined}
        >
          <PencilIcon />
          {t('edit')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={onDelete}
          disabled={!canManageRoles}
          title={!canManageRoles ? insufficientTitle : undefined}
        >
          <Trash2Icon />
          {t('delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RolesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <article
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-background"
        >
          <Skeleton className="h-1.5 w-full rounded-none" />
          <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <div className="grid grid-cols-3 gap-1.5">
              <Skeleton className="h-7 rounded-lg" />
              <Skeleton className="h-7 rounded-lg" />
              <Skeleton className="h-7 rounded-lg" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
