import type { Metadata } from 'next';
import { headers } from 'next/headers';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { routing } from '@/shared/config/i18n/routing';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import { NotFoundContent } from '@/widgets/not-found-content';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

// Locale-scoped 404 — caught by ``notFound()`` from anywhere under
// ``[locale]/...`` (and by the framework when a path inside a known
// locale doesn't match). Inherits every provider mounted by
// ``[locale]/layout.tsx`` (next-intl, auth, query, header /
// sub-header / breadcrumb config), so we only need to render the
// chrome here. The root ``app/not-found.tsx`` stays for pathless
// 404s that don't reach the locale segment at all.

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

export default function LocaleNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/*
        Contribute the three mode-entry tabs (find a course / my
        learning / teach) to the locale-root HeaderConfigProvider so
        the AppHeader on the 404 page still feels navigable instead
        of a dead end.
      */}
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  );
}
