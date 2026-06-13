'use client';

import { AppHeader } from './app-header';
import {
  useHeaderActiveKey,
  useHeaderConfig,
} from './header-config-provider';

export function AppHeaderShell() {
  const { navItems, brandHref, brandSuffix } = useHeaderConfig();
  const activeKey = useHeaderActiveKey();

  return (
    <AppHeader
      navItems={navItems}
      activeKey={activeKey}
      brandHref={brandHref}
      brandSuffix={brandSuffix}
    />
  );
}
