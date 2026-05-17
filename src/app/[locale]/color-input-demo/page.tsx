import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ColorInputDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'ColorInput demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ColorInputDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ColorInputDemoView />;
}
