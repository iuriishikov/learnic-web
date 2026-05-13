import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { TextareaDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Textarea demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TextareaDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TextareaDemoView />;
}
