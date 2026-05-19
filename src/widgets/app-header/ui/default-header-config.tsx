'use client';

import { useTranslations } from 'next-intl';

import type { AppHeaderNavItem } from './app-header';
import { HeaderConfig } from './header-config';

/**
 * Default nav for routes outside the `(learn)` / `(teach)` shells
 * (landing, marketplace, etc.) — three mode-entry tabs that let an
 * authenticated user jump into the catalog, into their learning
 * area, or into the teaching studio. The `(learn)` and `(teach)`
 * layouts still mount their own `HeaderConfig` deeper in the tree;
 * the last mounted config wins, so navigating into one of those
 * shells overrides these defaults without any cleanup needed here.
 */
export function DefaultHeaderConfig() {
  const t = useTranslations('default-shell');

  const navItems: AppHeaderNavItem[] = [
    {
      key: 'marketplace',
      href: '/marketplace',
      label: t('nav.findCourse'),
    },
    {
      key: 'my-courses',
      href: '/my-courses',
      label: t('nav.myLearning'),
    },
    {
      key: 'dashboard',
      href: '/dashboard',
      label: t('nav.teach'),
    },
  ];

  return <HeaderConfig navItems={navItems} brandHref="/" />;
}
