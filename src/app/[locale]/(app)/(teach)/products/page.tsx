import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ProductsGeneralView } from '@/features/products';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.teach.products',
    noindex: true,
  });
}

export default async function TeachProductsGeneralPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductsGeneralView />;
}
