import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { SubHeaderConfig, type AppSubHeaderTab } from '@/widgets/app-header';

type ProductsLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TeachProductsLayout({
  children,
  params,
}: ProductsLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teach-shell.products' });

  const tabs: AppSubHeaderTab[] = [
    { key: 'general', href: '/products', label: t('tabs.general') },
    { key: 'catalog', href: '/products/catalog', label: t('tabs.catalog') },
  ];

  return (
    <>
      <SubHeaderConfig
        sectionKey="teach-products"
        ariaLabel={t('ariaLabel')}
        tabs={tabs}
      />
      {children}
    </>
  );
}
