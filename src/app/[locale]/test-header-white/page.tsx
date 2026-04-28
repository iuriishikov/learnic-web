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
    namespace: 'metadata.test.headerWhite',
    noindex: true,
  });
}

export default async function TestHeaderWhitePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('test.headerWhite');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader bordered={false} sticky={false} tone="dark" />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-[1216px] px-4 py-12 md:px-6 md:py-20">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            {t('description')}
          </p>
          <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
            {t('lorem')}
          </p>
        </section>
      </main>
    </div>
  );
}
