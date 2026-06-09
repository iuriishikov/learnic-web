'use client';

import { useAuth } from '@/shared/auth';
import { AppHeaderShell, AppSubHeaderShell } from '@/widgets/app-header';
import { SiteHeader } from '@/widgets/site-header';

import { usePageHeaderConfig } from './page-header-config';

export function PageHeader() {
  const { user } = useAuth();
  const { siteHeaderVariant } = usePageHeaderConfig();

  if (!user) {
    return <SiteHeader variant={siteHeaderVariant} />;
  }

  return (
    <>
      <AppHeaderShell />
      <AppSubHeaderShell />
    </>
  );
}
