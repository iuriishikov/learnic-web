import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { ContactsSettingsView } from '@/features/user-contacts';
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
    namespace: 'settings.contacts.page',
    noindex: true,
  });
}

export default async function SettingsContactsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ContactsSettingsView />;
}
