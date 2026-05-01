import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ScrollbarDemoClient } from './scrollbar-demo-client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ScrollbarDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ScrollbarDemoClient />;
}
