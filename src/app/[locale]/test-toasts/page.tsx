import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { TestToastsClient } from './test-toasts-client';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function TestToastsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TestToastsClient />;
}
