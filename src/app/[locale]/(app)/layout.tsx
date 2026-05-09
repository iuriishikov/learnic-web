import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { sanitizeRedirectTarget } from '@/features/auth/lib/redirect';
import { getCurrentUser } from '@/features/auth/server';
import { PushBanner } from '@/features/web-push';
import { QueryProvider } from '@/shared/api/query-provider';
import { redirect } from '@/shared/config/i18n/navigation';
import { Toaster } from '@/shared/ui/sonner';
import {
  AppBreadcrumbsShell,
  AppHeaderShell,
  AppSubHeaderShell,
  BreadcrumbConfigProvider,
  HeaderConfigProvider,
  SubHeaderConfigProvider,
} from '@/widgets/app-header';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type AppLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { locale } = await params;
  const user = await getCurrentUser();
  if (!user) {
    const requestHeaders = await headers();
    const from = sanitizeRedirectTarget(requestHeaders.get('x-pathname'));
    const href = from ? `/login?from=${encodeURIComponent(from)}` : '/login';
    redirect({ href, locale });
  }

  return (
    <QueryProvider>
      <HeaderConfigProvider>
        <SubHeaderConfigProvider>
          <BreadcrumbConfigProvider>
            <div className="flex min-h-screen flex-col bg-background">
              <AppHeaderShell />
              <AppSubHeaderShell />
              <AppBreadcrumbsShell />
              <main className="flex-1">{children}</main>
            </div>
            <PushBanner />
            <Toaster />
          </BreadcrumbConfigProvider>
        </SubHeaderConfigProvider>
      </HeaderConfigProvider>
    </QueryProvider>
  );
}
