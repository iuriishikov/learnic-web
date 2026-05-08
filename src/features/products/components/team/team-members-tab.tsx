'use client';

import {
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  CrownIcon,
  KeyRoundIcon,
  MailPlusIcon,
  MoreHorizontalIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserCheckIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { type ReactNode, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
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
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/ui/hover-card';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

import {
  ALL_PERMISSIONS,
  BUILTIN_ROLES,
  CUSTOM_ROLES,
  MOCK_MEMBERS,
  type TeamMember,
  type TeamRole,
  type TeamStatus,
  getInitials,
  roleColorClasses,
} from './team-mock';

const ROLES: ReadonlyArray<TeamRole> = [...BUILTIN_ROLES, ...CUSTOM_ROLES];

type RoleFilter = 'all' | string;

export function TeamMembersTab() {
  const t = useTranslations('teach-products.editor.team');
  const tStats = useTranslations('teach-products.editor.team.stats');
  const reduceMotion = useReducedMotion();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_MEMBERS.filter((m) => {
      if (roleFilter !== 'all' && m.roleId !== roleFilter) return false;
      if (q.length === 0) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.handle.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
      );
    });
  }, [search, roleFilter]);

  const total = MOCK_MEMBERS.length;
  const online = MOCK_MEMBERS.filter((m) => m.status === 'active').length;
  const pendingCount = MOCK_MEMBERS.filter((m) => m.status === 'invited').length;
  const rolesActive = new Set(MOCK_MEMBERS.map((m) => m.roleId)).size;

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const someFilteredSelected =
    !allFilteredSelected && filtered.some((m) => selected.has(m.id));

  const onToggleAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((m) => {
        if (checked) next.add(m.id);
        else next.delete(m.id);
      });
      return next;
    });
  };

  const onToggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const filterOptions: ReadonlyArray<{ key: RoleFilter; label: string; count: number }> =
    useMemo(() => {
      const items: Array<{ key: RoleFilter; label: string; count: number }> = [
        { key: 'all', label: t('filters.all'), count: total },
      ];
      ROLES.forEach((role) => {
        const count = MOCK_MEMBERS.filter((m) => m.roleId === role.id).length;
        if (count === 0 && role.id !== 'owner') return;
        const label = role.builtIn ? t(`roles.${role.name}`) : role.name;
        items.push({ key: role.id, label, count });
      });
      return items;
    }, [t, total]);

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
        />
        <StatTile
          icon={<ZapIcon />}
          label={tStats('online')}
          value={online}
          tone="success"
        />
        <StatTile
          icon={<MailPlusIcon />}
          label={tStats('pending')}
          value={pendingCount}
          tone="warning"
        />
        <StatTile
          icon={<ShieldCheckIcon />}
          label={tStats('rolesCount')}
          value={rolesActive}
          tone="brand"
        />
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.ariaLabel')}
            className="h-9 bg-background pl-9 text-sm"
          />
        </div>
        <FilterChips
          options={filterOptions}
          value={roleFilter}
          onChange={setRoleFilter}
          ariaLabel={t('filters.ariaLabel')}
          reduceMotion={!!reduceMotion}
        />
      </div>

      {/* Table (md+) */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-background md:block">
        {filtered.length === 0 ? (
          <FilteredEmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onCheckedChange={(checked) => onToggleAll(checked === true)}
                    aria-label={t('table.selectAll')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  {t('table.name')}
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {t('table.status')}
                    <ArrowUpDownIcon aria-hidden className="size-3" />
                  </span>
                </TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">
                  {t('table.email')}
                </TableHead>
                <TableHead className="hidden text-xs font-medium text-muted-foreground lg:table-cell">
                  {t('table.role')}
                </TableHead>
                <TableHead className="hidden text-xs font-medium text-muted-foreground lg:table-cell">
                  {t('table.lastActive')}
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
                  selected={selected.has(member.id)}
                  onToggle={(checked) => onToggleRow(member.id, checked)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Card list (mobile) */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.length === 0 ? (
          <FilteredEmptyState />
        ) : (
          filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              selected={selected.has(member.id)}
              onToggle={(checked) => onToggleRow(member.id, checked)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {filtered.length > 0 ? (
        <nav
          aria-label="pagination"
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2 sm:px-4"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 bg-background px-2.5 sm:px-3"
          >
            <ChevronLeftIcon className="size-3.5" />
            <span className="hidden sm:inline">{t('pagination.previous')}</span>
          </Button>
          <p className="text-xs font-medium text-muted-foreground">
            {t('pagination.label', { page: 1, total: 10 })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 bg-background px-2.5 sm:px-3"
          >
            <span className="hidden sm:inline">{t('pagination.next')}</span>
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </nav>
      ) : null}

      {/* Floating selection bar */}
      <AnimatePresence initial={false}>
        {selected.size > 0 ? (
          <motion.div
            key="selection-bar"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }
            }
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-6"
          >
            <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-border bg-popover/95 p-2 pl-3 shadow-lg ring-1 ring-foreground/5 backdrop-blur-md">
              <p className="flex-1 truncate text-xs font-medium text-foreground sm:text-sm">
                {t('selectionBar.label', { count: selected.size })}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
              >
                <UserCheckIcon className="size-3.5" />
                <span className="hidden sm:inline">
                  {t('selectionBar.changeRole')}
                </span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
                <span className="hidden sm:inline">
                  {t('selectionBar.remove')}
                </span>
              </Button>
              <div className="h-5 w-px bg-border" />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('selectionBar.clear')}
                onClick={() => setSelected(new Set())}
                className="text-muted-foreground hover:text-foreground"
              >
                <XIcon />
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat tile                                                                   */
/* -------------------------------------------------------------------------- */

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'default' | 'success' | 'warning' | 'brand';
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
        <span className="font-heading text-xl font-semibold leading-tight tabular-nums tracking-tight text-foreground sm:text-2xl">
          {value}
        </span>
        <span className="truncate text-[11px] uppercase tracking-wider text-muted-foreground sm:text-xs sm:normal-case sm:tracking-normal">
          {label}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter chips with sliding brand pill                                        */
/* -------------------------------------------------------------------------- */

function FilterChips({
  options,
  value,
  onChange,
  ariaLabel,
  reduceMotion,
}: {
  options: ReadonlyArray<{ key: RoleFilter; label: string; count: number }>;
  value: RoleFilter;
  onChange: (key: RoleFilter) => void;
  ariaLabel: string;
  reduceMotion: boolean;
}) {
  return (
    <LayoutGroup id="team-filter-chips">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="-mx-1 flex shrink-0 items-center gap-0.5 overflow-x-auto rounded-full border border-border bg-muted/40 p-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {options.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.key)}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'text-brand-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active ? (
                <motion.span
                  layoutId="team-filter-pill"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 32 }
                  }
                  className="absolute inset-0 rounded-full bg-brand shadow-sm"
                />
              ) : null}
              <span className="relative">{option.label}</span>
              <span
                className={cn(
                  'relative rounded-full px-1.5 py-px text-[10px] font-mono tabular-nums',
                  active
                    ? 'bg-brand-foreground/15 text-brand-foreground'
                    : 'bg-foreground/[0.04] text-muted-foreground',
                )}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

/* -------------------------------------------------------------------------- */
/* Member row + card                                                           */
/* -------------------------------------------------------------------------- */

function MemberRow({
  member,
  selected,
  onToggle,
}: {
  member: TeamMember;
  selected: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const t = useTranslations('teach-products.editor.team');

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <TableRow
            data-state={selected ? 'selected' : undefined}
            className="group/row"
          />
        }
      >
        <TableCell className="pl-4">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onToggle(checked === true)}
            aria-label={t('table.selectRow')}
          />
        </TableCell>
        <TableCell>
          <MemberHoverCard member={member}>
            <div className="flex cursor-default items-center gap-3">
              <Avatar size="default">
                {member.avatarUrl ? (
                  <AvatarImage src={member.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span className="truncate">{member.name}</span>
                  {member.roleId === 'owner' ? (
                    <CrownIcon
                      aria-hidden
                      className="size-3.5 shrink-0 text-brand"
                    />
                  ) : null}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  @{member.handle}
                </span>
              </div>
            </div>
          </MemberHoverCard>
        </TableCell>
        <TableCell>
          <StatusBadge status={member.status} />
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          <span className="block max-w-[200px] truncate" title={member.email}>
            {member.email}
          </span>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <RoleBadge roleId={member.roleId} />
        </TableCell>
        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
          <LastActive minutes={member.lastActiveMinutes} status={member.status} />
        </TableCell>
        <TableCell className="pr-3 text-right">
          <RowMenu roleId={member.roleId} status={member.status} />
        </TableCell>
      </ContextMenuTrigger>
      <RowContextMenu roleId={member.roleId} status={member.status} />
    </ContextMenu>
  );
}

function MemberCard({
  member,
  selected,
  onToggle,
}: {
  member: TeamMember;
  selected: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const t = useTranslations('teach-products.editor.team');
  return (
    <div
      data-state={selected ? 'selected' : undefined}
      className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 data-[state=selected]:border-brand/50 data-[state=selected]:bg-brand/5"
    >
      <Checkbox
        checked={selected}
        onCheckedChange={(checked) => onToggle(checked === true)}
        aria-label={t('table.selectRow')}
        className="mt-1"
      />
      <Avatar size="default">
        {member.avatarUrl ? (
          <AvatarImage src={member.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="truncate">{member.name}</span>
            {member.roleId === 'owner' ? (
              <CrownIcon aria-hidden className="size-3.5 shrink-0 text-brand" />
            ) : null}
          </span>
          <RowMenu roleId={member.roleId} status={member.status} />
        </div>
        <span className="truncate text-xs text-muted-foreground">
          {member.email}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={member.status} />
          <RoleBadge roleId={member.roleId} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Hover card                                                                  */
/* -------------------------------------------------------------------------- */

function MemberHoverCard({
  member,
  children,
}: {
  member: TeamMember;
  children: ReactNode;
}) {
  const t = useTranslations('teach-products.editor.team');
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const formatter = useFormatter();
  const role = ROLES.find((r) => r.id === member.roleId);
  const roleName = role?.builtIn
    ? tRoles(role.name)
    : role?.name ?? member.roleId;
  const tone = role ? roleColorClasses(role.color) : roleColorClasses('brand');

  return (
    <HoverCard>
      <HoverCardTrigger render={<div>{children}</div>} />
      <HoverCardContent className="w-72 p-0" sideOffset={8}>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {member.avatarUrl ? (
                <AvatarImage src={member.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span className="truncate">{member.name}</span>
                {member.roleId === 'owner' ? (
                  <CrownIcon className="size-3.5 shrink-0 text-brand" />
                ) : null}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {member.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md ring-1 ring-foreground/10',
                tone.bgSoft,
              )}
            >
              <KeyRoundIcon className={cn('size-3.5', tone.text)} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-semibold text-foreground">
                {roleName}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {role?.id === 'owner'
                  ? tRoles('fullAccess')
                  : tRoles('permissionsCount', {
                      count: role?.permissions.length ?? 0,
                    })}
              </span>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {role?.permissions.length ?? 0}/{ALL_PERMISSIONS.length}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex flex-col gap-0.5 rounded-lg border border-border px-2.5 py-1.5">
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('table.joinedAt')}
              </dt>
              <dd className="font-medium text-foreground">
                {formatter.dateTime(new Date(member.joinedAt), {
                  dateStyle: 'medium',
                })}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg border border-border px-2.5 py-1.5">
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('table.lastActive')}
              </dt>
              <dd className="font-medium text-foreground">
                <LastActive
                  minutes={member.lastActiveMinutes}
                  status={member.status}
                />
              </dd>
            </div>
          </dl>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: TeamStatus }) {
  const t = useTranslations('teach-products.editor.team.status');
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-foreground/10',
        statusToneClass(status),
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-1.5 rounded-full',
          status === 'active' && 'bg-emerald-500',
          status === 'offline' && 'bg-muted-foreground/50',
          status === 'invited' && 'bg-amber-500',
        )}
      />
      {t(status)}
    </span>
  );
}

function RoleBadge({ roleId }: { roleId: string }) {
  const t = useTranslations('teach-products.editor.team.roles');
  const role = ROLES.find((r) => r.id === roleId);
  if (!role) return null;
  const name = role.builtIn ? t(role.name) : role.name;
  const tone = roleColorClasses(role.color);
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

function LastActive({
  minutes,
  status,
}: {
  minutes: number;
  status: TeamStatus;
}) {
  const t = useTranslations('teach-products.editor.team.lastActive');
  if (status === 'invited')
    return <span className="text-muted-foreground">—</span>;
  if (minutes < 5) return <span>{t('now')}</span>;
  if (minutes < 60) return <span>{t('minutesAgo', { minutes })}</span>;
  if (minutes < 60 * 24) {
    return <span>{t('hoursAgo', { hours: Math.floor(minutes / 60) })}</span>;
  }
  return <span>{t('daysAgo', { days: Math.floor(minutes / (60 * 24)) })}</span>;
}

function RowMenu({ roleId, status }: { roleId: string; status: TeamStatus }) {
  const t = useTranslations('teach-products.editor.team');
  const tActions = useTranslations('teach-products.editor.team.rowActions');
  const isOwner = roleId === 'owner';
  const isInvited = status === 'invited';
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
        <DropdownMenuItem disabled={isOwner}>
          <UserCheckIcon />
          {tActions('changeRole')}
        </DropdownMenuItem>
        {isInvited ? (
          <DropdownMenuItem>
            <MailPlusIcon />
            {tActions('resendInvite')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem>
          <CopyIcon />
          {tActions('copyEmail')}
        </DropdownMenuItem>
        {!isOwner ? (
          <DropdownMenuItem>
            <CrownIcon />
            {tActions('transferOwnership')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={isOwner}>
          <Trash2Icon />
          {tActions('remove')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowContextMenu({
  roleId,
  status,
}: {
  roleId: string;
  status: TeamStatus;
}) {
  const tActions = useTranslations('teach-products.editor.team.rowActions');
  const isOwner = roleId === 'owner';
  const isInvited = status === 'invited';
  return (
    <ContextMenuContent className="w-52">
      <ContextMenuItem disabled={isOwner}>
        <UserCheckIcon />
        {tActions('changeRole')}
      </ContextMenuItem>
      {isInvited ? (
        <ContextMenuItem>
          <MailPlusIcon />
          {tActions('resendInvite')}
        </ContextMenuItem>
      ) : null}
      <ContextMenuItem>
        <CopyIcon />
        {tActions('copyEmail')}
      </ContextMenuItem>
      {!isOwner ? (
        <ContextMenuItem>
          <CrownIcon />
          {tActions('transferOwnership')}
        </ContextMenuItem>
      ) : null}
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" disabled={isOwner}>
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

function statusToneClass(status: TeamStatus): string {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    case 'offline':
      return 'bg-muted text-muted-foreground';
    case 'invited':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
  }
}
