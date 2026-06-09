import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { FunctionGraphDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Function graph demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function FunctionGraphDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <FunctionGraphDemoView />;
}
