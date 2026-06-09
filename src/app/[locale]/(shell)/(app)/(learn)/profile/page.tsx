import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { PagePlaceholder } from '@/shared/ui/page-placeholder';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.profile',
    noindex: true,
  });
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tTabs = await getTranslations('profile.subHeader.tabs');
  const tPage = await getTranslations('profile.page');

  return (
    <PagePlaceholder
      title={tTabs('my-details')}
      description={tPage('description')}
      body={tPage('body')}
    />
  );
}
