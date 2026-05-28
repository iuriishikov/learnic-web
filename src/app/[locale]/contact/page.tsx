import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ContactSection } from '@/features/contact';
import { CONTACT_EMAIL } from '@/shared/config/site';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact.meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/*
        Contact lives outside the ``(app)`` / ``(learn)`` / ``(teach)``
        route groups, so it doesn't inherit a HeaderConfig from a parent
        layout. ``DefaultHeaderConfig`` contributes the mode-entry tabs
        for the authenticated header; anonymous visitors see
        ``SiteHeader`` (``PageHeader`` branches on the current user).
      */}
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex flex-1 items-center">
        <ContactSection contactEmail={CONTACT_EMAIL} />
      </main>
      <SiteFooter />
    </div>
  );
}
