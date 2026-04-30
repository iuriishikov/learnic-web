'use client';

import { AppSubHeader } from './app-sub-header';
import { useSubHeaderConfig } from './sub-header-config-provider';

export function AppSubHeaderShell() {
  const { sectionKey, ariaLabel, tabs, activeKey } = useSubHeaderConfig();

  return (
    <AppSubHeader
      sectionKey={sectionKey}
      ariaLabel={ariaLabel}
      tabs={tabs}
      activeKey={activeKey}
    />
  );
}
