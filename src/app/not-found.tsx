import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';

import { routing } from '@/shared/config/i18n/routing';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { NotFoundContent } from '@/widgets/not-found-content';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

async function resolveLocale(): Promise<string> {
  const headersList = await headers();
  return headersList.get('x-locale') ?? routing.defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return buildPageMetadata({
    locale,
    namespace: 'metadata.notFound',
    noindex: true,
  });
}

export default async function NotFound() {
  const locale = await resolveLocale();
  setRequestLocale(locale);
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <NotFoundContent />
        </main>
        <SiteFooter />
      </div>
    </NextIntlClientProvider>
  );
}
