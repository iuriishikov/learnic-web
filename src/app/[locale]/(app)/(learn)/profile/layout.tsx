import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { SubHeaderConfig, type AppSubHeaderTab } from '@/widgets/app-header';

type ProfileLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'profile.subHeader' });

  const tabs: AppSubHeaderTab[] = [
    { key: 'my-details', href: '/profile', label: t('tabs.my-details') },
    { key: 'profile', href: '/profile/profile', label: t('tabs.profile') },
    { key: 'password', href: '/profile/password', label: t('tabs.password') },
    { key: 'team', href: '/profile/team', label: t('tabs.team') },
    { key: 'plan', href: '/profile/plan', label: t('tabs.plan') },
    { key: 'billing', href: '/profile/billing', label: t('tabs.billing') },
    { key: 'email', href: '/profile/email', label: t('tabs.email') },
    {
      key: 'notifications',
      href: '/profile/notifications',
      label: t('tabs.notifications'),
      badge: 2,
    },
    {
      key: 'integrations',
      href: '/profile/integrations',
      label: t('tabs.integrations'),
    },
    { key: 'api', href: '/profile/api', label: t('tabs.api') },
  ];

  return (
    <>
      <SubHeaderConfig
        sectionKey="profile"
        ariaLabel={t('ariaLabel')}
        tabs={tabs}
      />
      {children}
    </>
  );
}
