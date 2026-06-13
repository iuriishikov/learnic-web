'use client';

import { BookOpenIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ComponentType } from 'react';

import { NoteSearchMenu, UserSearchMenu } from './admin-search-menus';
import { SectionHeader } from './section-header';

type ActionKey = 'users' | 'notes';

type ActionItem = {
  key: ActionKey;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
};

export function QuickActions() {
  const t = useTranslations('admin-dashboard');
  const [openMenu, setOpenMenu] = useState<ActionKey | null>(null);

  const items: ActionItem[] = [
    {
      key: 'users',
      Icon: UsersIcon,
      title: t('quickActions.manageUsersTitle'),
      desc: t('quickActions.manageUsersDesc'),
    },
    {
      key: 'notes',
      Icon: BookOpenIcon,
      title: t('quickActions.manageNotesTitle'),
      desc: t('quickActions.manageNotesDesc'),
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t('quickActions.title')} showSeparator={false} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map(({ key, Icon, title, desc }) => (
          <button
            key={key}
            type="button"
            onClick={() => setOpenMenu(key)}
            className="flex items-stretch gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:hover:bg-muted/50"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-transparent text-foreground">
              <Icon className="size-6" />
            </span>
            <span className="flex min-w-0 flex-col justify-between py-px">
              <span className="text-sm font-semibold leading-snug text-foreground">
                {title}
              </span>
              <span className="truncate text-xs leading-snug text-muted-foreground">
                {desc}
              </span>
            </span>
          </button>
        ))}
      </div>

      <UserSearchMenu
        open={openMenu === 'users'}
        onOpenChange={(next) => setOpenMenu(next ? 'users' : null)}
      />
      <NoteSearchMenu
        open={openMenu === 'notes'}
        onOpenChange={(next) => setOpenMenu(next ? 'notes' : null)}
      />
    </section>
  );
}
