import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { CommandDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Command demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CommandDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CommandDemoView />;
}
