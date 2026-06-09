import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { UserLinkDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'UserLink demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UserLinkDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UserLinkDemoView />;
}
