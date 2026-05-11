import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ProductShowcaseDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Product card demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductShowcaseDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProductShowcaseDemoView />;
}
