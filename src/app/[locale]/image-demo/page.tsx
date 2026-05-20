import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ImageDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Image demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ImageDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ImageDemoView />;
}
