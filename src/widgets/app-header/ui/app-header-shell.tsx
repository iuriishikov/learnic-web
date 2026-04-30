'use client';

import { AppHeader } from './app-header';
import { useHeaderConfig } from './header-config-provider';

export function AppHeaderShell() {
  const { navItems, brandHref, brandSuffix } = useHeaderConfig();

  return (
    <AppHeader
      navItems={navItems}
      brandHref={brandHref}
      brandSuffix={brandSuffix}
    />
  );
}
