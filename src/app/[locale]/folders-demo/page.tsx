import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { LibraryView } from '@/features/folders-demo';

export const metadata: Metadata = {
  title: 'Folders demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FoldersDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LibraryView />;
}
