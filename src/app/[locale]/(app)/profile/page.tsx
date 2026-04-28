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
  const t = await getTranslations('app.profile');
  const tTabs = await getTranslations(
    'app-header.subHeader.sections.profile.tabs',
  );

  return (
    <PagePlaceholder
      title={tTabs('my-details')}
      description={t('description')}
      body={t('lorem')}
    />
  );
}
