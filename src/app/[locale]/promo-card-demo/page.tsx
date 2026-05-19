import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PromoCardDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'PromoCard demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PromoCardDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PromoCardDemoView />;
}
