import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  APP_MODE_COOKIE,
  DEFAULT_APP_MODE,
  SettingsHeaderConfig,
  SubHeaderConfig,
  isAppMode,
  type AppSubHeaderTab,
} from '@/widgets/app-header';

type SettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings.subHeader' });

  const cookieStore = await cookies();
  const cookieMode = cookieStore.get(APP_MODE_COOKIE)?.value;
  const mode = isAppMode(cookieMode) ? cookieMode : DEFAULT_APP_MODE;

  const tabs: AppSubHeaderTab[] = [
    { key: 'profile', href: '/settings', label: t('tabs.profile') },
    {
      key: 'experience',
      href: '/settings/experience',
      label: t('tabs.experience'),
    },
    {
      key: 'contacts',
      href: '/settings/contacts',
      label: t('tabs.contacts'),
    },
    {
      key: 'preferences',
      href: '/settings/preferences',
      label: t('tabs.preferences'),
    },
    {
      key: 'notifications',
      href: '/settings/notifications',
      label: t('tabs.notifications'),
    },
    {
      key: 'security',
      href: '/settings/security',
      label: t('tabs.security'),
    },
  ];

  return (
    <>
      <SettingsHeaderConfig mode={mode} />
      <SubHeaderConfig
        sectionKey="settings"
        ariaLabel={t('ariaLabel')}
        tabs={tabs}
      />
      <div className="mx-auto w-full max-w-[1024px] px-4 py-8 md:px-8 md:py-12">
        {children}
      </div>
    </>
  );
}
