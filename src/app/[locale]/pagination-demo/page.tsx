import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PaginationDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Pagination demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PaginationDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PaginationDemoView />;
}
