import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { FileCardDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'File card demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FileCardDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FileCardDemoView />;
}
