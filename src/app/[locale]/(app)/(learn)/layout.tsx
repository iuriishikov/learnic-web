import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  BreadcrumbConfig,
  HeaderConfig,
  type AppHeaderNavItem,
} from '@/widgets/app-header';

type LearnLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LearnLayout({
  children,
  params,
}: LearnLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'learn-shell' });

  const navItems: AppHeaderNavItem[] = [
    { key: 'marketplace', href: '/marketplace', label: t('nav.marketplace') },
    { key: 'my-courses', href: '/my-courses', label: t('nav.myCourses') },
    { key: 'community', href: '/community', label: t('nav.community') },
  ];

  return (
    <>
      <HeaderConfig navItems={navItems} brandHref="/marketplace" />
      <BreadcrumbConfig
        slot="learn-root"
        order={1}
        segments={[{ label: t('breadcrumbs.root'), href: '/marketplace' }]}
      />
      {children}
    </>
  );
}
