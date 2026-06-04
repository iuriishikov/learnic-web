import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  BreadcrumbConfig,
  HeaderConfig,
  ModeTracker,
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
    { key: 'my-notes', href: '/my-notes', label: t('nav.myNotes') },
    { key: 'community', href: '/community', label: t('nav.community') },
  ];

  return (
    <>
      <ModeTracker mode="learn" />
      <HeaderConfig navItems={navItems} brandHref="/" />
      <BreadcrumbConfig
        slot="learn-root"
        order={1}
        segments={[{ label: t('breadcrumbs.root'), href: '/marketplace' }]}
      />
      {children}
    </>
  );
}
