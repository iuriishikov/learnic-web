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
    return <HeaderConfig navItems={navItems} brandHref="/marketplace" />;
  }

  const navItems: AppHeaderNavItem[] = [
    { key: 'products', href: '/products', label: tTeach('nav.products') },
    { key: 'dashboard', href: '/dashboard', label: tTeach('nav.dashboard') },
  ];

  return (
    <HeaderConfig
      navItems={navItems}
      brandHref="/dashboard"
      brandSuffix={
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
          {tTeach('studioBadge')}
        </span>
      }
    />
  );
}
