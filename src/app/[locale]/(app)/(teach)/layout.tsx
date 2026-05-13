import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  BreadcrumbConfig,
  HeaderConfig,
  ModeTracker,
  type AppHeaderNavItem,
} from '@/widgets/app-header';

type TeachLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TeachLayout({
  children,
  params,
}: TeachLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teach-shell' });

  const navItems: AppHeaderNavItem[] = [
    { key: 'products', href: '/products', label: t('nav.products') },
    { key: 'dashboard', href: '/dashboard', label: t('nav.dashboard') },
  ];

  return (
    <>
      <ModeTracker mode="teach" />
      <HeaderConfig navItems={navItems} brandHref="/dashboard" />
      <BreadcrumbConfig
        slot="teach-root"
        order={1}
        segments={[{ label: t('breadcrumbs.root'), href: '/dashboard' }]}
      />
      {children}
    </>
  );
}
