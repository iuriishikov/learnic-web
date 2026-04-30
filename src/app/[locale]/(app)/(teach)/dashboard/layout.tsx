import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { SubHeaderConfig, type AppSubHeaderTab } from '@/widgets/app-header';

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TeachDashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'teach-shell.dashboard',
  });

  const tabs: AppSubHeaderTab[] = [
    { key: 'overview', href: '/dashboard', label: t('tabs.overview') },
  ];

  return (
    <>
      <SubHeaderConfig
        sectionKey="teach-dashboard"
        ariaLabel={t('ariaLabel')}
        tabs={tabs}
      />
      {children}
    </>
  );
}
