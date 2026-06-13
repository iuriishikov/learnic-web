import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { LegalDocumentScreen, legalDocumentMetadata } from '@/features/legal';
import { SiteFooter } from '@/widgets/site-footer';

type ConsentDistributionPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateMetadata(): Promise<Metadata> {
  return legalDocumentMetadata('consent-distribution');
}

export default async function ConsentDistributionPage({
  params,
}: ConsentDistributionPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="flex-1">
        <LegalDocumentScreen slug="consent-distribution" />
      </main>
      <SiteFooter />
    </>
  );
}
