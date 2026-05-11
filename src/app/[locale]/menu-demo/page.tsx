import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { MenuDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Menu demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function MenuDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <MenuDemoView />;
}
