import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { HelpSection } from '@/features/help';
import { CONTACT_EMAIL } from '@/shared/config/site';
import { SiteFooter } from '@/widgets/site-footer';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'help.meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function HelpPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="flex flex-1 items-center">
        <HelpSection contactEmail={CONTACT_EMAIL} />
      </main>
      <SiteFooter />
    </>
  );
}
