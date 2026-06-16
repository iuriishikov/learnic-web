import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/features/auth/server';
import { LegalDocumentScreen, legalDocumentMetadata } from '@/features/legal';
import { SiteFooter } from '@/widgets/site-footer';

type ConsentPersonalDataPageProps = {
  params: Promise<{ locale: string }>;
};

export function generateMetadata(): Promise<Metadata> {
  return legalDocumentMetadata('consent-personal-data');
}

export default async function ConsentPersonalDataPage({
  params,
}: ConsentPersonalDataPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await getCurrentUser();

  return (
    <>
      <main className="flex-1">
        <LegalDocumentScreen slug="consent-personal-data" loggedIn={Boolean(user)} />
      </main>
      <SiteFooter />
    </>
  );
}
