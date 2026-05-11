import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { InputDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Input demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function InputDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <InputDemoView />;
}
