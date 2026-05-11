import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { SwitchDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Switch demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SwitchDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SwitchDemoView />;
}
