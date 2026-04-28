import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PagePlaceholder } from '@/shared/ui/page-placeholder';

const PRODUCTS_TABS = [
  'catalog',
  'categories',
  'inventory',
  'pricing',
] as const;

type ProductsTab = (typeof PRODUCTS_TABS)[number];

type PageProps = {
  params: Promise<{ locale: string; tab: string }>;
};

function isProductsTab(value: string): value is ProductsTab {
  return (PRODUCTS_TABS as readonly string[]).includes(value);
}

export async function generateStaticParams() {
  return PRODUCTS_TABS.map((tab) => ({ tab }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, tab } = await params;
  if (!isProductsTab(tab)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({
    locale,
    namespace: 'app-header.subHeader.sections.products.tabs',
  });
  return {
    title: t(tab),
    robots: { index: false, follow: false },
  };
}

export default async function ProductsTabPage({ params }: PageProps) {
  const { locale, tab } = await params;
  if (!isProductsTab(tab)) notFound();
  setRequestLocale(locale);

  const tTabs = await getTranslations(
    'app-header.subHeader.sections.products.tabs',
  );
  const tApp = await getTranslations('app.products');

  return (
    <PagePlaceholder
      title={tTabs(tab)}
      description={tApp('description')}
      body={tApp('lorem')}
    />
  );
}
