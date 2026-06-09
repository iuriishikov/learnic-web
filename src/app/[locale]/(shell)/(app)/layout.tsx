import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { sanitizeRedirectTarget } from '@/shared/lib/redirect';
import { getCurrentUser } from '@/features/auth/server';
import { PushBanner } from '@/features/web-push';
import { redirect } from '@/shared/config/i18n/navigation';
import { AppBreadcrumbsShell } from '@/widgets/app-header';

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

  // The app-wide header now lives in the shared `(shell)` layout (the common
  // ancestor of this group and `(default-shell)`), so it is no longer
  // remounted when navigating across the auth boundary. This layout only adds
  // the auth gate plus the in-app chrome (breadcrumbs + push banner) on top.
  // Route groups inside `(app)` contribute only `SubHeaderConfig`, never their
  // own `HeaderConfig`. The breadcrumbs/main/push-banner render as flex
  // children of the shell's `min-h-screen flex flex-col` column.
  return (
    <>
      <AppBreadcrumbsShell />
      <main className="flex-1">{children}</main>
      <PushBanner />
    </>
  );
}
