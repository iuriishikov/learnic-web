'use client';

import {
  CopyIcon,
  CrownIcon,
  KeyRoundIcon,
  MailPlusIcon,
  MoreHorizontalIcon,
  RotateCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCheckIcon,
  UsersIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useMemo, useState } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { TextInput } from '@/shared/ui/input-extended';
import { NavTabs } from '@/shared/ui/nav-tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { UserAvatar, type AvatarUser } from '@/shared/ui/user-avatar';
import { UserLink } from '@/shared/ui/user-link';

import { useProductPermissions } from '../../api/use-product-permissions';
import {
  useMyEffectivePermissions,
  useProductCollaborations,
  useProductRoles,
  useRevokeCollaborationMutation,
  useUpdateGrantsMutation,
} from '../../api/use-team';
import { OWNER_POSITION } from '../../model/team';
import type { Role } from '../../model/team';
import type { Product } from '../../model/types';

import {
  assignableRoles,
  canActOnPosition,
  colorForRole,
  emailHandle,
  primaryGrant,
  roleColorClasses,
} from './team-shared';

type RoleFilter = 'all' | string;

type DisplayMember = {
  id: string;
  /** Real platform user id, or `null` for an account-less email invite. */
  userId: string | null;
  name: string;
  email: string;
  status: 'active' | 'invited' | 'owner';
  /** Backend role id, or `null` for the product owner (synthetic). */
  roleId: string | null;
  /** Resolved display name for the role chip. */
  roleName: string;
  collaborationId: string | null;
  joinedAt: string;
  /** True for the synthetic owner row — not removable / not role-changeable. */
  isOwner: boolean;
  /** Effective hierarchy slot of this member. Owner has 0; collaborators
   *  have the position of their highest product-scope role. */
  position: number;
  avatar: AvatarUser;
};

export function TeamMembersTab({
  productId,
  product,
}: {
  productId: string;
  product: Product;
}) {
  const t = useTranslations('teach-products.editor.team');
  const tStats = useTranslations('teach-products.editor.team.stats');
  const tToast = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  const tLoad = useTranslations('teach-products.editor.team.load');
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const reduceMotion = useReducedMotion();

  const collabsQuery = useProductCollaborations(productId);
  const rolesQuery = useProductRoles(productId);
  const myPerms = useMyEffectivePermissions(productId);
  const myPosition = myPerms.data?.hierarchyPosition ?? null;
  const perms = useProductPermissions(productId);
  const canManageCollaborators = perms.canManageCollaborators;
  const canManageRoles = perms.canManageRoles;
  const tEditor = useTranslations('teach-products.editor');
  const insufficientTitle = tEditor('insufficientPermissions');
  const revoke = useRevokeCollaborationMutation(productId);
  const updateGrants = useUpdateGrantsMutation(productId);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const rolesById = useMemo(() => {
    const map = new Map<string, Role>();
    for (const r of roles) map.set(r.id, r);
    return map;
  }, [roles]);

  const ownerName = product.author.fullName.trim();

  const members = useMemo<DisplayMember[]>(() => {
    const list: DisplayMember[] = [];

    list.push({
      id: `owner:${product.author.id}`,
      userId: product.author.id,
      name: ownerName.length > 0 ? ownerName : tRoles('owner'),
      email: product.author.email,
      status: 'owner',
      roleId: null,
      roleName: tRoles('owner'),
      collaborationId: null,
      joinedAt: product.createdAt,
      isOwner: true,
      position: OWNER_POSITION,
      avatar: {
        id: product.author.id,
        fullName: product.author.fullName,
        avatar: null,
      },
    });

    if (!collabsQuery.data) return list;

    for (const c of collabsQuery.data) {
      // Terminal statuses are audit-only — not part of the active team.
      if (c.status === 'revoked' || c.status === 'declined') continue;
      const grant = primaryGrant(c.grants);
      const role = grant ? rolesById.get(grant.roleId) : undefined;
      const roleId = grant?.roleId ?? null;
      const roleName = role?.name ?? grant?.roleName ?? '';

      const name =
        c.collaborator !== null
          ? c.collaborator.fullName.trim() || c.collaborator.email
          : c.invitedEmail ?? '';
      const email = c.collaborator?.email ?? c.invitedEmail ?? '';

      // Effective rank: lowest product-scope role position across grants.
      let memberPosition = Number.POSITIVE_INFINITY;
      for (const g of c.grants) {
        if (g.scopeType !== 'product') continue;
        const r = rolesById.get(g.roleId);
        if (r && r.position < memberPosition) memberPosition = r.position;
      }

      const avatarFullName =
        c.collaborator?.fullName ??
        (c.invitedEmail ? emailHandle(c.invitedEmail) : '');

      list.push({
        id: c.id,
        userId: c.collaborator?.id ?? null,
        name,
        email,
        status: c.status === 'active' ? 'active' : 'invited',
        roleId,
        roleName,
        collaborationId: c.id,
        joinedAt: c.acceptedAt ?? c.createdAt,
        isOwner: false,
        position: memberPosition,
        avatar: {
          id: c.collaborator?.id ?? c.id,
          fullName: avatarFullName,
          avatar: null,
        },
      });
    }

    return list;
  }, [
    collabsQuery.data,
    product.author.id,
    product.author.fullName,
    product.author.email,
    product.createdAt,
    ownerName,
    rolesById,
    tRoles,
  ]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== 'all') {
        if (roleFilter === 'owner') {
          if (!m.isOwner) return false;
        } else if (m.roleId !== roleFilter) {
          return false;
        }
      }
      if (q.length === 0) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [members, search, roleFilter]);

  const total = members.length;
  const activeCount = members.filter(
    (m) => m.status === 'active' || m.isOwner,
  ).length;
  const pendingCount = members.filter((m) => m.status === 'invited').length;
  const rolesActive =
    new Set(
      members.map((m) => m.roleId).filter((r): r is string => r !== null),
    ).size + 1;

  const filterOptions: ReadonlyArray<{
    key: RoleFilter;
    label: string;
    count: number;
  }> = useMemo(() => {
    const items: Array<{ key: RoleFilter; label: string; count: number }> = [
      { key: 'all', label: t('filters.all'), count: total },
    ];
    items.push({
      key: 'owner',
      label: tRoles('owner'),
      count: members.filter((m) => m.isOwner).length,
    });
    for (const role of roles) {
      const count = members.filter((m) => m.roleId === role.id).length;
      if (count === 0) continue;
      items.push({ key: role.id, label: role.name, count });
    }
    return items;
  }, [t, tRoles, total, roles, members]);

  const onCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard
      .writeText(email)
      .then(() => notify.success(tToast('copyEmailSuccess')))
      .catch(() => notify.error(tToast('copyEmailFailed')));
  };

  const onRevoke = (collaborationId: string) => {
    revoke.mutate({ collaborationId });
  };

  const onChangeRole = (collaborationId: string, roleId: string) => {
    updateGrants.mutate({
      collaborationId,
      grants: [{ roleId, scopeType: 'product', scopeId: null }],
    });
  };

  const isLoading = collabsQuery.isPending || rolesQuery.isPending;
  const hasError = collabsQuery.isError || rolesQuery.isError;

  return (
    <motion.div
      key="members-tab"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-5"
    >
      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatTile
          icon={<UsersIcon />}
          label={tStats('total')}
          value={total}
          tone="default"
          loading={isLoading}
        />
        <StatTile
          icon={<UserCheckIcon />}
          label={tStats('active')}
          value={activeCount}
          tone="success"
          loading={isLoading}
        />
        <StatTile
          icon={<MailPlusIcon />}
          label={tStats('pending')}
          value={pendingCount}
          tone="warning"
          loading={isLoading}
        />
        <StatTile
          icon={<ShieldCheckIcon />}
          label={tStats('rolesCount')}
          value={rolesActive}
          tone="brand"
          loading={isLoading}
        />
      </div>

      {hasError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-6"
        >
          <h4 className="font-heading text-base font-semibold tracking-tight text-foreground">
            {tLoad('errorTitle')}
          </h4>
          <p className="text-sm leading-snug text-muted-foreground">
            {tLoad('membersErrorDescription')}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              collabsQuery.refetch();
              rolesQuery.refetch();
            }}
            disabled={collabsQuery.isFetching || rolesQuery.isFetching}
            className="h-8 w-fit gap-1.5"
          >
            <RotateCwIcon
              className={cn(
                'size-3.5',
                (collabsQuery.isFetching || rolesQuery.isFetching) &&
                  'animate-spin',
              )}
            />
            {tLoad('retry')}
          </Button>
        </div>
      ) : null}

      {!hasError ? (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xs">
              <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <TextInput
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('search.placeholder')}
                aria-label={t('search.ariaLabel')}
                className="h-9 bg-background pl-9 text-sm"
                data-cursor-target="product.team.members.search"
              />
            </div>
            <NavTabs
              layoutId="team-role-filter"
              variant="pill"
              ariaLabel={t('filters.ariaLabel')}
              tabs={filterOptions.map((option) => ({
                key: option.key,
                label: option.label,
                badge: option.count,
              }))}
              activeKey={roleFilter}
              onChange={(key) => setRoleFilter(key as RoleFilter)}
            />
          </div>

          {isLoading ? (
            <MembersSkeleton />
          ) : filtered.length === 0 ? (
            <FilteredEmptyState />
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-2xl border border-border bg-background md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        {t('table.name')}
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        {t('table.status')}
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground">
                        {t('table.email')}
                      </TableHead>
                      <TableHead className="hidden text-xs font-medium text-muted-foreground lg:table-cell">
                        {t('table.role')}
                      </TableHead>
                      <TableHead className="hidden text-xs font-medium text-muted-foreground lg:table-cell">
                        {t('table.joinedAt')}
                      </TableHead>
                      <TableHead className="w-12 pr-3 text-right">
                        <span className="sr-only">{t('table.actions')}</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((member) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        roles={roles}
                        myPosition={myPosition}
                        onCopyEmail={() => onCopyEmail(member.email)}
                        onRevoke={() =>
                          member.collaborationId &&
                          onRevoke(member.collaborationId)
                        }
                        onChangeRole={(roleId) =>
                          member.collaborationId &&
                          onChangeRole(member.collaborationId, roleId)
                        }
                        canManageCollaborators={canManageCollaborators}
                        canManageRoles={canManageRoles}
                        insufficientPermissionsTitle={insufficientTitle}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-2 md:hidden">
                {filtered.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    roles={roles}
                    myPosition={myPosition}
                    onCopyEmail={() => onCopyEmail(member.email)}
                    onRevoke={() =>
                      member.collaborationId &&
                      onRevoke(member.collaborationId)
                    }
                    onChangeRole={(roleId) =>
                      member.collaborationId &&
                      onChangeRole(member.collaborationId, roleId)
                    }
                    canManageCollaborators={canManageCollaborators}
                    canManageRoles={canManageRoles}
                    insufficientPermissionsTitle={insufficientTitle}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat tile                                                                  */
/* -------------------------------------------------------------------------- */

function StatTile({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'default' | 'success' | 'warning' | 'brand';
  loading?: boolean;
}) {
  const toneClass = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    brand: 'bg-brand/10 text-brand',
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3 sm:gap-4 sm:p-4">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-foreground/5 [&>svg]:size-4',
          toneClass,
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        {loading ? (
          <Skeleton className="mb-1 h-6 w-10" />
        ) : (
          <span className="font-heading text-xl font-semibold leading-tight tabular-nums tracking-tight text-foreground sm:text-2xl">
            {value}
          </span>
        )}
        <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs sm:normal-case sm:tracking-normal">
          {label}
        </span>
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Member row + card                                                          */
/* -------------------------------------------------------------------------- */

function MemberRow({
  member,
  roles,
  myPosition,
  onCopyEmail,
  onRevoke,
  onChangeRole,
  canManageCollaborators,
  canManageRoles,
  insufficientPermissionsTitle,
}: {
  member: DisplayMember;
  roles: ReadonlyArray<Role>;
  myPosition: number | null;
  onCopyEmail: () => void;
  onRevoke: () => void;
  onChangeRole: (roleId: string) => void;
  canManageCollaborators: boolean;
  canManageRoles: boolean;
  insufficientPermissionsTitle: string;
}) {
  const formatter = useFormatter();

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<TableRow className="group/row" />}>
        <TableCell>
          <div className="flex items-center gap-3">
            <UserAvatar user={member.avatar} size="default" />
            <div className="flex min-w-0 flex-col">
              <MemberName member={member} />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <StatusBadge status={member.status} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          <span className="block max-w-[200px] truncate" title={member.email}>
            {member.email || '—'}
          </span>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <RoleBadge member={member} roles={roles} />
        </TableCell>
        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
          {member.joinedAt
            ? formatter.dateTime(new Date(member.joinedAt), {
                dateStyle: 'medium',
              })
            : '—'}
        </TableCell>
        <TableCell className="pr-3 text-right">
          <RowMenu
            member={member}
            roles={roles}
            myPosition={myPosition}
            onCopyEmail={onCopyEmail}
            onRevoke={onRevoke}
            onChangeRole={onChangeRole}
            canManageCollaborators={canManageCollaborators}
            canManageRoles={canManageRoles}
            insufficientPermissionsTitle={insufficientPermissionsTitle}
          />
        </TableCell>
      </ContextMenuTrigger>
      <RowContextMenu
        member={member}
        roles={roles}
        myPosition={myPosition}
        onCopyEmail={onCopyEmail}
        onRevoke={onRevoke}
        onChangeRole={onChangeRole}
        canManageCollaborators={canManageCollaborators}
        canManageRoles={canManageRoles}
      />
    </ContextMenu>
  );
}

function MemberCard({
  member,
  roles,
  myPosition,
  onCopyEmail,
  onRevoke,
  onChangeRole,
  canManageCollaborators,
  canManageRoles,
  insufficientPermissionsTitle,
}: {
  member: DisplayMember;
  roles: ReadonlyArray<Role>;
  myPosition: number | null;
  onCopyEmail: () => void;
  onRevoke: () => void;
  onChangeRole: (roleId: string) => void;
  canManageCollaborators: boolean;
  canManageRoles: boolean;
  insufficientPermissionsTitle: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
      <UserAvatar user={member.avatar} size="default" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <MemberName member={member} />
          <RowMenu
            member={member}
            roles={roles}
            myPosition={myPosition}
            onCopyEmail={onCopyEmail}
            onRevoke={onRevoke}
            onChangeRole={onChangeRole}
            canManageCollaborators={canManageCollaborators}
            canManageRoles={canManageRoles}
            insufficientPermissionsTitle={insufficientPermissionsTitle}
          />
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {member.email || '—'}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={member.status} />
          <RoleBadge member={member} roles={roles} />
        </div>
      </div>
    </div>
  );
}

/**
 * Member name cell. Real platform users (owner + accepted collaborators) get a
 * `UserLink` — brand-underlined link to their public page with the shared hover
 * preview, enriched here with a team-context footer ({@link MemberTenure}).
 * Account-less email invites have no profile, so they render as plain text.
 */
function MemberName({ member }: { member: DisplayMember }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
      {member.userId ? (
        <UserLink
          userId={member.userId}
          seed={member.avatar}
          previewExtra={<MemberTenure member={member} />}
          className="truncate"
        >
          {member.name}
        </UserLink>
      ) : (
        <span className="truncate">{member.name}</span>
      )}
      {member.isOwner ? (
        <CrownIcon aria-hidden className="size-3.5 shrink-0 text-brand" />
      ) : null}
    </span>
  );
}

/**
 * Team-context footer for the `UserLink` hover preview: the member's role
 * (with a "full access" note for the owner) and when they joined the team —
 * data the public profile doesn't carry.
 */
function MemberTenure({ member }: { member: DisplayMember }) {
  const t = useTranslations('teach-products.editor.team');
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const formatter = useFormatter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand/10 ring-1 ring-foreground/10">
          <KeyRoundIcon className="size-3.5 text-brand" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-xs font-semibold text-foreground">
            {member.roleName}
          </span>
          {member.isOwner ? (
            <span className="text-[11px] text-muted-foreground">
              {tRoles('fullAccess')}
            </span>
          ) : null}
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex flex-col gap-0.5 rounded-lg border border-border px-2.5 py-1.5">
          <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('table.joinedAt')}
          </dt>
          <dd className="font-medium text-foreground">
            {member.joinedAt
              ? formatter.dateTime(new Date(member.joinedAt), {
                  dateStyle: 'medium',
                })
              : '—'}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: DisplayMember['status'] }) {
  const t = useTranslations('teach-products.editor.team.status');
  const label = status === 'owner' ? t('active') : t(status);
  const dot = status === 'invited' ? 'bg-amber-500' : 'bg-emerald-500';
  const tone =
    status === 'invited'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-foreground/10',
        tone,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}

function RoleBadge({
  member,
  roles,
}: {
  member: DisplayMember;
  roles: ReadonlyArray<Role>;
}) {
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const role = member.roleId
    ? roles.find((r) => r.id === member.roleId)
    : null;
  const tone = role
    ? roleColorClasses(colorForRole(role))
    : roleColorClasses('brand');
  const name = member.isOwner
    ? tRoles('owner')
    : role?.name ?? member.roleName;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        tone.bgSoft,
        tone.text,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', tone.dot)} />
      {name}
    </span>
  );
}

function RowMenu({
  member,
  roles,
  myPosition,
  onCopyEmail,
  onRevoke,
  onChangeRole,
  canManageCollaborators,
  canManageRoles,
  insufficientPermissionsTitle,
}: {
  member: DisplayMember;
  roles: ReadonlyArray<Role>;
  myPosition: number | null;
  onCopyEmail: () => void;
  onRevoke: () => void;
  onChangeRole: (roleId: string) => void;
  canManageCollaborators: boolean;
  canManageRoles: boolean;
  insufficientPermissionsTitle: string;
}) {
  const t = useTranslations('teach-products.editor.team');
  const tActions = useTranslations('teach-products.editor.team.rowActions');
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const canManage = canActOnPosition(myPosition, member.position);
  const allowedRoles = assignableRoles(roles, myPosition);
  if (member.isOwner || !canManage) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('table.rowMenu')}
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end" sideOffset={4} className="w-52">
          <DropdownMenuItem
            onClick={onCopyEmail}
            disabled={member.email.length === 0}
          >
            <CopyIcon />
            {tActions('copyEmail')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('table.rowMenu')}
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontalIcon />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger
            disabled={!canManageRoles}
            title={!canManageRoles ? insufficientPermissionsTitle : undefined}
          >
            <UserCheckIcon />
            {tActions('changeRole')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {allowedRoles.length === 0 ? (
              <DropdownMenuItem disabled>
                {tRoles('noRolesAvailable')}
              </DropdownMenuItem>
            ) : (
              allowedRoles.map((role) => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => onChangeRole(role.id)}
                  disabled={role.id === member.roleId || !canManageRoles}
                >
                  {role.name}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          onClick={onCopyEmail}
          disabled={member.email.length === 0}
        >
          <CopyIcon />
          {tActions('copyEmail')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={onRevoke}
          disabled={!canManageCollaborators}
        >
          <Trash2Icon />
          {tActions('remove')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowContextMenu({
  member,
  roles,
  myPosition,
  onCopyEmail,
  onRevoke,
  onChangeRole,
  canManageCollaborators,
  canManageRoles,
}: {
  member: DisplayMember;
  roles: ReadonlyArray<Role>;
  myPosition: number | null;
  onCopyEmail: () => void;
  onRevoke: () => void;
  onChangeRole: (roleId: string) => void;
  canManageCollaborators: boolean;
  canManageRoles: boolean;
}) {
  const tActions = useTranslations('teach-products.editor.team.rowActions');
  const canManage = canActOnPosition(myPosition, member.position);
  const allowedRoles = assignableRoles(roles, myPosition);
  if (member.isOwner || !canManage) {
    return (
      <ContextMenuContent className="w-52">
        <ContextMenuItem
          onClick={onCopyEmail}
          disabled={member.email.length === 0}
        >
          <CopyIcon />
          {tActions('copyEmail')}
        </ContextMenuItem>
      </ContextMenuContent>
    );
  }
  return (
    <ContextMenuContent className="w-56">
      {allowedRoles.slice(0, 4).map((role) => (
        <ContextMenuItem
          key={role.id}
          onClick={() => onChangeRole(role.id)}
          disabled={role.id === member.roleId || !canManageRoles}
        >
          <UserCheckIcon />
          {role.name}
        </ContextMenuItem>
      ))}
      <ContextMenuItem
        onClick={onCopyEmail}
        disabled={member.email.length === 0}
      >
        <CopyIcon />
        {tActions('copyEmail')}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        variant="destructive"
        onClick={onRevoke}
        disabled={!canManageCollaborators}
      >
        <Trash2Icon />
        {tActions('remove')}
      </ContextMenuItem>
    </ContextMenuContent>
  );
}

function FilteredEmptyState() {
  const t = useTranslations('teach-products.editor.team.filteredEmpty');
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
        <SearchIcon className="size-4" />
      </div>
      <p className="text-sm font-medium text-foreground">{t('title')}</p>
      <p className="max-w-xs text-xs leading-snug text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}

function MembersSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex flex-col divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-5 w-20 rounded-full md:block" />
            <Skeleton className="hidden h-5 w-24 rounded-full lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
