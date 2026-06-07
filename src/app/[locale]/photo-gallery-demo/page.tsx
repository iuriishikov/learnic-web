import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PhotoGalleryDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Photo gallery demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PhotoGalleryDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PhotoGalleryDemoView />;
}
