import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ProfileForm } from '@/features/auth';
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
    namespace: 'settings.page',
    noindex: true,
  });
}

export default async function SettingsProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProfileForm />;
}
