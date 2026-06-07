import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ProductInfoDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Product info — design demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductInfoDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductInfoDemoView />;
}
