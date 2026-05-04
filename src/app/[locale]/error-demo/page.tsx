import type { Metadata } from 'next';
import { ArrowRightIcon } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { SiteFooter } from '@/widgets/site-footer';
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
    namespace: 'metadata.errorDemo.index',
    noindex: true,
  });
}

type DemoCard = {
  key: 'error400' | 'error401' | 'error403' | 'notFound' | 'error500' | 'error503';
  href: string;
};

const DEMO_CARDS: DemoCard[] = [
  { key: 'error400', href: '/error-demo/400' },
  { key: 'error401', href: '/error-demo/401' },
  { key: 'error403', href: '/error-demo/403' },
  { key: 'notFound', href: '/_not-a-real-page-to-trigger-404_' },
  { key: 'error500', href: '/error-demo/500' },
  { key: 'error503', href: '/error-demo/503' },
];

export default async function ErrorDemoIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'error-demo' });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-[1200px] px-4 py-10 md:px-8 md:py-16">
          <header className="flex flex-col gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t('title')}
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground md:text-base">
              {t('description')}
            </p>
            <div className="mt-2 inline-flex w-fit max-w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-foreground">
              <span className="text-muted-foreground">
                {t('usage.title')}:
              </span>
              <code>{'<ErrorContent label title description … />'}</code>
            </div>
          </header>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {DEMO_CARDS.map((card) => (
              <Link
                key={card.key}
                href={card.href}
                className="group flex flex-col rounded-xl bg-muted/50 p-6 transition-colors hover:bg-muted/70 md:p-7"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {t(`cards.${card.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-[1.55] text-muted-foreground">
                  {t(`cards.${card.key}.description`)}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                  {t(`cards.${card.key}.cta`)}
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
