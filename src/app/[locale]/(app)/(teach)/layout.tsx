import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { HeaderConfig, type AppHeaderNavItem } from '@/widgets/app-header';

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
    { key: 'settings', href: '/settings', label: t('nav.settings') },
  ];

  return (
    <>
      <HeaderConfig
        navItems={navItems}
        brandHref="/dashboard"
        brandSuffix={
          <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
            {t('studioBadge')}
          </span>
        }
      />
      {children}
    </>
  );
}
