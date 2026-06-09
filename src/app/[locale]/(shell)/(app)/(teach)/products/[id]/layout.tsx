import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { BreadcrumbConfig } from '@/widgets/app-header';

type ProductDetailLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProductDetailLayout({
  children,
  params,
}: ProductDetailLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'teach-products.breadcrumbs',
  });

  return (
    <>
      <BreadcrumbConfig
        slot="teach-products"
        order={2}
        segments={[{ label: t('section'), href: '/products' }]}
      />
      {children}
    </>
  );
}
