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
    namespace: 'metadata.marketplace',
    noindex: true,
  });
}

export default async function MarketplacePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('marketplace.page');

  return (
    <PagePlaceholder
      title={t('title')}
      description={t('subtitle')}
      body={t('body')}
    />
  );
}
