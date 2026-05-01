import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  getProductById,
  ProductEditorView,
  type Product,
} from '@/features/products';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { BreadcrumbConfig } from '@/widgets/app-header';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.teach.editor',
    noindex: true,
  });
}

export default async function ProductEditorPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getProductById(id);
  const product = result.ok ? result.product : buildMockProduct(id);

  const t = await getTranslations({
    locale,
    namespace: 'teach-products.editor',
  });
  const breadcrumbLabel =
    product.title.trim().length > 0 ? product.title : t('untitled');

  return (
    <>
      <BreadcrumbConfig
        slot="product-editor"
        order={3}
        segments={[{ label: breadcrumbLabel }]}
      />
      <ProductEditorView product={product} />
    </>
  );
}

function buildMockProduct(id: string): Product {
  const now = new Date().toISOString();
  return {
    id,
    type: 'course',
    status: 'draft',
    title: 'Marketing site redesign',
    description: '',
    durationHours: 0,
    priceAmount: '0',
    priceCurrency: 'RUB',
    author: {
      id: 'mock-author',
      firstName: 'Olivia',
      lastName: 'Rhye',
      patronymic: null,
    },
    webinarDetails: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}
