import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { LegalDocumentScreen, legalDocumentMetadata } from '@/features/legal';
import { SiteFooter } from '@/widgets/site-footer';

type TermsPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateMetadata(): Promise<Metadata> {
  return legalDocumentMetadata('terms');
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="flex-1">
        <LegalDocumentScreen slug="terms" />
      </main>
      <SiteFooter />
    </>
  );
}
