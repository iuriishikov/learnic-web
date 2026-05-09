'use client';

import {
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import {
  useMyEffectivePermissions,
  useProductCollaborations,
  useProductRoles,
} from '../api/use-team';
import type { Product } from '../model/types';

import { TeamInvitationsTab } from './team/team-invitations-tab';
import { TeamInviteDialog } from './team/team-invite-dialog';
import { TeamMembersTab } from './team/team-members-tab';
import { TeamRolesTab } from './team/team-roles-tab';

const TAB_KEYS = ['members', 'roles', 'invitations'] as const;
type TabKey = (typeof TAB_KEYS)[number];

export function ProductTeamSection({ product }: { product: Product }) {
  const t = useTranslations('teach-products.editor.team');
  const reduceMotion = useReducedMotion();

  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [inviteOpen, setInviteOpen] = useState(false);

  const collabsQuery = useProductCollaborations(product.id);
  const rolesQuery = useProductRoles(product.id);
  const myPerms = useMyEffectivePermissions(product.id);
  const canInvite =
    myPerms.data?.permissions.includes('manage_collaborators') ?? false;

  const counts = useMemo(() => {
    const collabs = collabsQuery.data ?? [];
    const activeCollabs = collabs.filter((c) => c.status === 'active');
    const pending = collabs.filter((c) => c.status === 'pending_invite');
    const roles = rolesQuery.data ?? [];
    return {
      // +1 for the product owner row in the members list.
      members: activeCollabs.length + 1,
      roles: roles.length,
      invitations: pending.length,
    };
  }, [collabsQuery.data, rolesQuery.data]);

  const memberRoleId = useMemo(() => {
    const roles = rolesQuery.data ?? [];
    if (roles.length === 0) return null;
    // Default-pick the lowest-rank role available (largest position)
    // so a fresh invite cannot accidentally outrank existing members.
    // The user can still pick any role from the dialog.
    const sorted = [...roles].sort((a, b) => b.position - a.position);
    return sorted[0]?.id ?? null;
  }, [rolesQuery.data]);

  return (
    <motion.section
      key="team-section"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <header className="flex flex-col gap-4 px-1">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                {t('title')}
              </h2>
              <Badge
                variant="outline"
                className="h-6 rounded-full bg-background px-2 text-xs font-medium text-muted-foreground"
              >
                <UsersIcon aria-hidden className="size-3" />
                {t('memberCount', { count: counts.members })}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('description')}
            </p>
          </div>
          {canInvite ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setInviteOpen(true)}
                disabled={
                  rolesQuery.isPending ||
                  rolesQuery.isError ||
                  (rolesQuery.data?.length ?? 0) === 0
                }
                className="h-9 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:px-4"
              >
                <UserPlusIcon className="size-4" />
                <span className="sm:hidden">{t('actions.addUser')}</span>
                <span className="hidden sm:inline">
                  {t('actions.addUserFull')}
                </span>
              </Button>
            </div>
          ) : null}
        </div>
      </header>

      <TeamTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={counts}
        reduceMotion={!!reduceMotion}
      />

      <div>
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'members' ? (
            <TeamMembersTab key="members" productId={product.id} product={product} />
          ) : activeTab === 'roles' ? (
            <TeamRolesTab key="roles" productId={product.id} />
          ) : (
            <TeamInvitationsTab
              key="invitations"
              productId={product.id}
              onAddInvite={() => setInviteOpen(true)}
            />
          )}
        </AnimatePresence>
      </div>

      <TeamInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        productId={product.id}
        ownerId={product.author.id}
        roles={rolesQuery.data ?? []}
        defaultRoleId={memberRoleId}
      />
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* Tabs with sliding underline                                                 */
/* -------------------------------------------------------------------------- */

function TeamTabs({
  activeTab,
  onChange,
  counts,
  reduceMotion,
}: {
  activeTab: TabKey;
  onChange: (key: TabKey) => void;
  counts: { members: number; roles: number; invitations: number };
  reduceMotion: boolean;
}) {
  const t = useTranslations('teach-products.editor.team.tabs');
  return (
    <LayoutGroup id="team-tabs">
      <div
        role="tablist"
        aria-label={t('members')}
        className="-mx-1 flex overflow-x-auto border-b border-border px-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
      >
        {TAB_KEYS.map((key) => {
          const active = key === activeTab;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(key)}
              className={cn(
                'relative inline-flex shrink-0 items-center gap-2 px-3 pb-2.5 pt-1.5 text-sm font-medium transition-colors',
                active
                  ? 'text-brand'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{t(key)}</span>
              <span
                className={cn(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-[10px] tabular-nums transition-colors',
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {count}
              </span>
              {active ? (
                <motion.span
                  layoutId="team-tab-underline"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 32 }
                  }
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
