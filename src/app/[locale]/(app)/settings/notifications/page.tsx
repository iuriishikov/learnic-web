import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { NotificationsView } from '@/widgets/settings';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'settings.notifications',
    noindex: true,
  });
}

export default async function SettingsNotificationsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NotificationsView />;
}
