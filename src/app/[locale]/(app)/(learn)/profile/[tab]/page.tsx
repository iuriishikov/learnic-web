import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PagePlaceholder } from '@/shared/ui/page-placeholder';

const PROFILE_TABS = [
  'profile',
  'password',
  'team',
  'plan',
  'billing',
  'email',
  'notifications',
  'integrations',
  'api',
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number];

type PageProps = {
  params: Promise<{ locale: string; tab: string }>;
};

function isProfileTab(value: string): value is ProfileTab {
  return (PROFILE_TABS as readonly string[]).includes(value);
}

export async function generateStaticParams() {
  return PROFILE_TABS.map((tab) => ({ tab }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, tab } = await params;
  if (!isProfileTab(tab)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({
    locale,
    namespace: 'profile.subHeader.tabs',
  });
  return {
    title: t(tab),
    robots: { index: false, follow: false },
  };
}

export default async function ProfileTabPage({ params }: PageProps) {
  const { locale, tab } = await params;
  if (!isProfileTab(tab)) notFound();
  setRequestLocale(locale);

  const tTabs = await getTranslations('profile.subHeader.tabs');
  const tPage = await getTranslations('profile.page');

  return (
    <PagePlaceholder
      title={tTabs(tab)}
      description={tPage('description')}
      body={tPage('body')}
    />
  );
}
