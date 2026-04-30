'use client';

import { useEffect } from 'react';

import type { AppSubHeaderTab } from './app-sub-header';
import { useSetSubHeaderConfig } from './sub-header-config-provider';

export type SubHeaderConfigProps = {
  sectionKey: string;
  ariaLabel: string;
  tabs: AppSubHeaderTab[];
  activeKey?: string;
};

export function SubHeaderConfig({
  sectionKey,
  ariaLabel,
  tabs,
  activeKey,
}: SubHeaderConfigProps) {
  const setConfig = useSetSubHeaderConfig();
  useEffect(() => {
    setConfig({ sectionKey, ariaLabel, tabs, activeKey });
    return () => setConfig(null);
  }, [sectionKey, ariaLabel, tabs, activeKey, setConfig]);
  return null;
}
