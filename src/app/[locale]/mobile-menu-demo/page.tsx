import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { MobileMenuDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Mobile menu demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MobileMenuDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MobileMenuDemoView />;
}
