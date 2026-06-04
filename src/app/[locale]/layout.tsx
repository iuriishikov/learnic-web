import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/features/auth';
import { getCurrentUser, getMyAdminStatus } from '@/features/auth/server';
import { PresenceProvider } from '@/features/presence';
import { QueryProvider } from '@/shared/api/query-provider';
import { routing } from '@/shared/config/i18n/routing';
import { SITE_NAME, SITE_URL, TITLE_TEMPLATE } from '@/shared/config/site';
import { BannerProvider } from '@/shared/ui/banner';
import { ResourceLimitDialogHost } from '@/shared/ui/resource-limit-dialog';
import { Toaster } from '@/shared/ui/sonner';
import {
  BreadcrumbConfigProvider,
  HeaderConfigProvider,
  SubHeaderConfigProvider,
} from '@/widgets/app-header';

const OG_LOCALES: Record<string, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata.site' });
  const title = t('title');
  const description = t('description');

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: {
      template: TITLE_TEMPLATE,
      default: title,
    },
    description,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALES[locale] ?? OG_LOCALES.ru,
      title,
      description,
      url: '/',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const initialUser = await getCurrentUser();
  const initialIsAdmin = initialUser ? await getMyAdminStatus() : false;

  return (
    <NextIntlClientProvider>
      <AuthProvider initialUser={initialUser} initialIsAdmin={initialIsAdmin}>
        <QueryProvider>
          <PresenceProvider>
            <BannerProvider>
              {/*
                Header / sub-header / breadcrumb config providers
                live at the root locale layout so public-shell
                routes (landing, marketplace, etc.) can contribute
                ``HeaderConfig`` the same way ``(app)`` does. The
                (learn) and (teach) layouts still mount their own
                ``HeaderConfig`` children — the last mount wins,
                matching the pre-lift behaviour.
              */}
              <HeaderConfigProvider>
                <SubHeaderConfigProvider>
                  <BreadcrumbConfigProvider>
                    {children}
                  </BreadcrumbConfigProvider>
                </SubHeaderConfigProvider>
              </HeaderConfigProvider>
            </BannerProvider>
          </PresenceProvider>
        </QueryProvider>
      </AuthProvider>
      <Toaster />
      <ResourceLimitDialogHost />
    </NextIntlClientProvider>
  );
}
