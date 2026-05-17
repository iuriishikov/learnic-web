'use client';

import { useAuth } from '@/shared/auth';
import { AppHeaderShell, AppSubHeaderShell } from '@/widgets/app-header';
import { SiteHeader } from '@/widgets/site-header';

export function PageHeader() {
  const { user } = useAuth();

  if (!user) {
    return <SiteHeader />;
  }

  return (
    <>
      <AppHeaderShell />
      <AppSubHeaderShell />
    </>
  );
}
