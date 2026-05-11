import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ExperienceSettingsView } from '@/features/user-experiences';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'settings.experience.page',
    noindex: true,
  });
}

export default async function SettingsExperiencePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ExperienceSettingsView />;
}
