import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { CollaborationCursorDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'Collaboration cursor demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CollaborationCursorDemoPage({
  params,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CollaborationCursorDemoView />;
}
