import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { SiteHeader } from '@/widgets/site-header';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.test.headerPurple',
    noindex: true,
  });
}

export default async function TestHeaderPurplePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('test.headerPurple');

  return (
    <div className="flex min-h-screen flex-col bg-brand">
      <SiteHeader bordered={false} sticky={false} tone="light" />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-[1216px] px-4 py-12 md:px-6 md:py-20">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-foreground md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-brand-foreground/80 md:text-lg">
            {t('description')}
          </p>
          <p className="mt-8 max-w-2xl text-sm text-brand-foreground/70">
            {t('lorem')}
          </p>
        </section>
      </main>
    </div>
  );
}
