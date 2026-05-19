import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import { FaqSection } from '@/widgets/faq-section';
import { FeaturesGrid } from '@/widgets/features-grid';
import { LandingHero } from '@/widgets/landing-hero';
import { LatestBlogPosts } from '@/widgets/latest-blog-posts';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomeProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.home',
    absoluteTitle: true,
  });
}

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/*
        Landing is outside ``(app)`` / ``(learn)`` / ``(teach)``,
        so it doesn't get a HeaderConfig from a parent layout.
        ``DefaultHeaderConfig`` contributes the three mode-entry
        tabs for the authenticated header — anonymous visitors
        still see ``SiteHeader`` (PageHeader branches on user).
      */}
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex-1">
        <LandingHero />
        <FeaturesGrid />
        <FaqSection />
        <LatestBlogPosts />
      </main>
      <SiteFooter />
    </div>
  );
}
