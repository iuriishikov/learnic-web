export type SubHeaderTab = {
  key: string;
  href: string;
  badge?: number | string;
};

export type SubHeaderSection = {
  key: string;
  basePath: string;
  tabs: SubHeaderTab[];
};

export const SUB_HEADER_SECTIONS: SubHeaderSection[] = [
  {
    key: 'profile',
    basePath: '/profile',
    tabs: [
      { key: 'my-details', href: '/profile' },
      { key: 'profile', href: '/profile/profile' },
      { key: 'password', href: '/profile/password' },
      { key: 'team', href: '/profile/team' },
      { key: 'plan', href: '/profile/plan' },
      { key: 'billing', href: '/profile/billing' },
      { key: 'email', href: '/profile/email' },
      { key: 'notifications', href: '/profile/notifications', badge: 2 },
      { key: 'integrations', href: '/profile/integrations' },
      { key: 'api', href: '/profile/api' },
    ],
  },
  {
    key: 'products',
    basePath: '/products',
    tabs: [
      { key: 'overview', href: '/products' },
      { key: 'catalog', href: '/products/catalog' },
      { key: 'categories', href: '/products/categories' },
      { key: 'inventory', href: '/products/inventory' },
      { key: 'pricing', href: '/products/pricing' },
    ],
  },
  {
    key: 'dashboard',
    basePath: '/dashboard',
    tabs: [
      { key: 'overview', href: '/dashboard' },
      { key: 'analytics', href: '/dashboard/analytics' },
      { key: 'reports', href: '/dashboard/reports' },
      { key: 'activity', href: '/dashboard/activity', badge: 5 },
    ],
  },
];

export function findSubHeaderSection(
  pathname: string,
): SubHeaderSection | undefined {
  let match: SubHeaderSection | undefined;
  for (const section of SUB_HEADER_SECTIONS) {
    if (
      pathname === section.basePath ||
      pathname.startsWith(`${section.basePath}/`)
    ) {
      if (!match || section.basePath.length > match.basePath.length) {
        match = section;
      }
    }
  }
  return match;
}

export function findActiveSubHeaderTab(
  section: SubHeaderSection,
  pathname: string,
): SubHeaderTab | undefined {
  let best: SubHeaderTab | undefined;
  for (const tab of section.tabs) {
    if (tab.href === pathname) return tab;
    if (pathname.startsWith(`${tab.href}/`)) {
      if (!best || tab.href.length > best.href.length) best = tab;
    }
  }
  return best ?? section.tabs[0];
}
