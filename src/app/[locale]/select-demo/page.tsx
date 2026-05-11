import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { SelectDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Select demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SelectDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SelectDemoView />;
}
