import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { UserExperiencesDemoView } from './demo-view';

export const metadata: Metadata = {
  title: 'ExperienceCard demo',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UserExperiencesDemoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <UserExperiencesDemoView />;
}
