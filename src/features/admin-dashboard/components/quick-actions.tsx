'use client';

import { BookOpenIcon, UsersIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';

import { useComingSoon } from '../lib/use-coming-soon';
import { SectionHeader } from './section-header';

type ActionItem = {
  key: string;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
};

export function QuickActions() {
  const t = useTranslations('admin-dashboard');
  const comingSoon = useComingSoon();
  const reduce = useReducedMotion();

  const items: ActionItem[] = [
    {
      key: 'users',
      Icon: UsersIcon,
      title: t('quickActions.manageUsersTitle'),
      desc: t('quickActions.manageUsersDesc'),
    },
    {
      key: 'courses',
      Icon: BookOpenIcon,
      title: t('quickActions.manageCoursesTitle'),
      desc: t('quickActions.manageCoursesDesc'),
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t('quickActions.title')} showSeparator={false} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map(({ key, Icon, title, desc }) => (
          <motion.button
            key={key}
            type="button"
            onClick={comingSoon}
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.99 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground">
              <Icon className="size-5" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-medium text-foreground">
                {title}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {desc}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
