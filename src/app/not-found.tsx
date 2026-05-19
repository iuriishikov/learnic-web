import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { headers } from 'next/headers';

import { AuthProvider } from '@/features/auth';
import { getCurrentUser } from '@/features/auth/server';
import { QueryProvider } from '@/shared/api/query-provider';
import { routing } from '@/shared/config/i18n/routing';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import {
  DefaultHeaderConfig,
  HeaderConfigProvider,
} from '@/widgets/app-header';
import { NotFoundContent } from '@/widgets/not-found-content';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

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
  const initialUser = await getCurrentUser();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider initialUser={initialUser}>
        <QueryProvider>
          {/*
            Global not-found is outside ``[locale]/layout.tsx``, so
            it doesn't inherit that layout's
            ``HeaderConfigProvider``. Mount a local one here +
            ``DefaultHeaderConfig`` so ``PageHeader`` still shows
            the three mode-entry tabs instead of an empty nav.
          */}
          <HeaderConfigProvider>
            <DefaultHeaderConfig />
            <div className="flex min-h-screen flex-col bg-background">
              <PageHeader />
              <main className="flex-1">
                <NotFoundContent />
              </main>
              <SiteFooter />
            </div>
          </HeaderConfigProvider>
        </QueryProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
