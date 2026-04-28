import type { Metadata } from 'next';

import { routing } from '@/shared/config/i18n/routing';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { NotFoundContent } from '@/widgets/not-found-content';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    locale: routing.defaultLocale,
    namespace: 'metadata.notFound',
    noindex: true,
  });
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  );
}
