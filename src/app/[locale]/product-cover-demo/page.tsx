import { setRequestLocale } from 'next-intl/server';

import { ProductCoverDemoClient } from './product-cover-demo-client';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductCoverDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductCoverDemoClient />;
}
