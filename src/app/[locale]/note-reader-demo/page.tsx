import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { NoteReaderDemoView } from '@/features/products';

export const metadata: Metadata = {
  title: 'Note reader demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function NoteReaderDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NoteReaderDemoView />;
}
