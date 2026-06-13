import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { LegalDocumentScreen, legalDocumentMetadata } from '@/features/legal';
import { SiteFooter } from '@/widgets/site-footer';

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateMetadata(): Promise<Metadata> {
  return legalDocumentMetadata('privacy');
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="flex-1">
        <LegalDocumentScreen slug="privacy" />
      </main>
      <SiteFooter />
    </>
  );
}
