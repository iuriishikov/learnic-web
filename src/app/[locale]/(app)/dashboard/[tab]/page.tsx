import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PagePlaceholder } from '@/shared/ui/page-placeholder';

const DASHBOARD_TABS = ['analytics', 'reports', 'activity'] as const;

type DashboardTab = (typeof DASHBOARD_TABS)[number];

type PageProps = {
  params: Promise<{ locale: string; tab: string }>;
};

function isDashboardTab(value: string): value is DashboardTab {
  return (DASHBOARD_TABS as readonly string[]).includes(value);
}

export async function generateStaticParams() {
  return DASHBOARD_TABS.map((tab) => ({ tab }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, tab } = await params;
  if (!isDashboardTab(tab)) {
    return { robots: { index: false, follow: false } };
  }
  const t = await getTranslations({
    locale,
    namespace: 'app-header.subHeader.sections.dashboard.tabs',
  });
  return {
    title: t(tab),
    robots: { index: false, follow: false },
  };
}

export default async function DashboardTabPage({ params }: PageProps) {
  const { locale, tab } = await params;
  if (!isDashboardTab(tab)) notFound();
  setRequestLocale(locale);

  const tTabs = await getTranslations(
    'app-header.subHeader.sections.dashboard.tabs',
  );
  const tApp = await getTranslations('app.dashboard');

  return (
    <PagePlaceholder
      title={tTabs(tab)}
      description={tApp('description')}
      body={tApp('lorem')}
    />
  );
}
