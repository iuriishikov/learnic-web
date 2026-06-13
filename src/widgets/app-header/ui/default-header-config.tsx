'use client';

import { useTranslations } from 'next-intl';

import type { AppHeaderNavItem } from './app-header';
import { HeaderConfig } from './header-config';

/**
 * The app-wide header nav — three mode-entry tabs that let an
 * authenticated user jump into the catalog, into their learning
 * area, or into the teaching studio. Mounted once by the shared
 * `(shell)` layout that wraps both the auth-gated `(app)` group and
 * the public `(default-shell)` group, so the header is identical
 * everywhere. Route groups never override it — shell-specific
 * navigation goes into `SubHeaderConfig` instead.
 */
export function DefaultHeaderConfig() {
  const t = useTranslations('default-shell');

  const navItems: AppHeaderNavItem[] = [
    {
      key: 'marketplace',
      href: '/marketplace',
      label: t('nav.findNote'),
    },
    {
      key: 'learning',
      href: '/learning',
      label: t('nav.myLearning'),
    },
    {
      key: 'products',
      href: '/products',
      label: t('nav.teach'),
    },
  ];

  return <HeaderConfig navItems={navItems} brandHref="/" />;
}
