'use client';

import { useTranslations } from 'next-intl';

import type { AppMode } from './app-mode';
import type { AppHeaderNavItem } from './app-header';
import { HeaderConfig } from './header-config';

/**
 * Renders the right shell header (studio vs. learning) on the
 * mode-neutral `/settings` route. The mode is resolved server-side
 * from the `learnic-mode` cookie set by `ModeTracker` in the matching
 * route group's layout.
 */
export function SettingsHeaderConfig({ mode }: { mode: AppMode }) {
  const tTeach = useTranslations('teach-shell');
  const tLearn = useTranslations('learn-shell');

  if (mode === 'learn') {
    const navItems: AppHeaderNavItem[] = [
      {
        key: 'marketplace',
        href: '/marketplace',
        label: tLearn('nav.marketplace'),
      },
      {
        key: 'my-courses',
        href: '/my-courses',
        label: tLearn('nav.myCourses'),
      },
      { key: 'community', href: '/community', label: tLearn('nav.community') },
    ];
    return <HeaderConfig navItems={navItems} brandHref="/" />;
  }

  const navItems: AppHeaderNavItem[] = [
    { key: 'products', href: '/products', label: tTeach('nav.products') },
  ];

  return <HeaderConfig navItems={navItems} brandHref="/" />;
}
