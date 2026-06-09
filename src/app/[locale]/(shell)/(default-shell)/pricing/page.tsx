import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { PageHeaderConfig } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

import { PricingView } from './pricing-view';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.pricing',
  });
}

export default async function PricingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeaderConfig siteHeaderVariant="transparent" />
      <PricingView />
      <SiteFooter />
    </>
  );
}
