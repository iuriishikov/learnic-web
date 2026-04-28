import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { PagePlaceholder } from '@/shared/ui/page-placeholder';
import { AppHeader, AppSubHeader } from '@/widgets/app-header';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.test.appHeader',
    noindex: true,
  });
}

export default async function TestAppHeaderPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('test.appHeader');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader activeNavKey="home" />
      <AppSubHeader sectionKey="profile" activeHref="/profile/team" />
      <AppSubHeader sectionKey="products" activeHref="/products/catalog" />
      <AppSubHeader sectionKey="dashboard" activeHref="/dashboard/activity" />
      <main className="flex-1">
        <PagePlaceholder title={t('title')} description={t('description')} body={t('lorem')} />
      </main>
    </div>
  );
}
