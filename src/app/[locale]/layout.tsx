import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Inter } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { AuthProvider } from '@/features/auth';
import { getCurrentUser } from '@/features/auth/server';
import { PresenceProvider } from '@/features/presence';
import { routing } from '@/shared/config/i18n/routing';
import {
  BRAND_COLOR,
  SITE_NAME,
  SITE_URL,
  TITLE_TEMPLATE,
} from '@/shared/config/site';
import { ThemeProvider } from '@/shared/ui/theme-provider';
import '../globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const OG_LOCALES: Record<string, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
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

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <AuthProvider initialUser={initialUser}>
              <PresenceProvider>{children}</PresenceProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
