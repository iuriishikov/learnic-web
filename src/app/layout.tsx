import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Geist_Mono, Inter } from 'next/font/google';

import { routing } from '@/shared/config/i18n/routing';
import {
  BRAND_COLOR,
  SITE_NAME,
  SITE_URL,
  TITLE_TEMPLATE,
} from '@/shared/config/site';
import { GlobalScrollbars } from '@/shared/ui/global-scrollbars';
import { ThemeProvider } from '@/shared/ui/theme-provider';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: BRAND_COLOR,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    template: TITLE_TEMPLATE,
    default: SITE_NAME,
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const headersList = await headers();
  const locale = headersList.get('x-locale') ?? routing.defaultLocale;

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
          <GlobalScrollbars />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
