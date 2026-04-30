import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { SubHeaderConfig, type AppSubHeaderTab } from '@/widgets/app-header';

type SettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TeachSettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'teach-shell.settings',
  });

  const tabs: AppSubHeaderTab[] = [
    { key: 'general', href: '/settings', label: t('tabs.general') },
  ];

  return (
    <>
      <SubHeaderConfig
        sectionKey="teach-settings"
        ariaLabel={t('ariaLabel')}
        tabs={tabs}
      />
      {children}
    </>
  );
}
