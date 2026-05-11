import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { DatePickerDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'DatePicker demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DatePickerDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DatePickerDemoView />;
}
