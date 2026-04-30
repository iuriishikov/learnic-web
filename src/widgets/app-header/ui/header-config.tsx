'use client';

import { useEffect, type ReactNode } from 'react';

import type { AppHeaderNavItem } from './app-header';
import { useSetHeaderConfig } from './header-config-provider';

export type HeaderConfigProps = {
  navItems: AppHeaderNavItem[];
  brandHref: string;
  brandSuffix?: ReactNode;
};

export function HeaderConfig({
  navItems,
  brandHref,
  brandSuffix = null,
}: HeaderConfigProps) {
  const setConfig = useSetHeaderConfig();
  useEffect(() => {
    setConfig({ navItems, brandHref, brandSuffix });
  }, [navItems, brandHref, brandSuffix, setConfig]);
  return null;
}
