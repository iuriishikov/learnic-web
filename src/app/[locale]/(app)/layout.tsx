import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { sanitizeRedirectTarget } from '@/shared/lib/redirect';
import { getCurrentUser } from '@/features/auth/server';
import { PushBanner } from '@/features/web-push';
import { redirect } from '@/shared/config/i18n/navigation';
import { AppBreadcrumbsShell } from '@/widgets/app-header';
import { PageHeader } from '@/widgets/page-header';

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

  // Header / sub-header / breadcrumb config providers now live in
  // the root locale layout so the public shell (landing,
  // marketplace) can contribute ``HeaderConfig`` too. This layout
  // is auth-gated and adds the in-app chrome (PageHeader +
  // breadcrumbs + push banner) on top.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader />
      <AppBreadcrumbsShell />
      <main className="flex-1">{children}</main>
      <PushBanner />
    </div>
  );
}
