import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  BlogIndex,
  type BlogIndexLabels,
  type FeaturedPostData,
  getPublishedPostAction,
  listPublishedPostsAction,
  toFeatured,
  toFeaturedFromSummary,
} from '@/features/blog';
import { SiteFooter } from '@/widgets/site-footer';

type BlogIndexPageProps = {
  params: Promise<{ locale: string }>;
};

/** First page of posts (lead story + grid). Further pages load on demand. */
const PAGE_SIZE = 9;

export async function generateMetadata({
  params,
}: BlogIndexPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function BlogIndexPage({ params }: BlogIndexPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const listed = await listPublishedPostsAction({ limit: PAGE_SIZE });
  if (!listed.ok) {
    // The post list is this page's primary resource — a network/server
    // failure renders the 500 boundary, never a faked empty index.
    throw new Error(`Failed to load blog index: ${listed.reason}`);
  }
  const summaries = listed.data;

  // Enrich the newest post for the lead story (topic / excerpt / author),
  // which the list endpoint's summaries don't carry. A failed enrichment
  // degrades to a summary-only hero rather than dropping it.
  let featured: FeaturedPostData | null = null;
  const newest = summaries[0];
  if (newest) {
    const full = await getPublishedPostAction(newest.slug);
    featured = full.ok ? toFeatured(full.data) : toFeaturedFromSummary(newest);
  }

  const t = await getTranslations('blog');
  const labels: BlogIndexLabels = {
    eyebrow: t('eyebrow'),
    title: t('title'),
    description: t('description'),
    allPosts: t('allPosts'),
    readPost: t('readPost'),
    readFeatured: t('readFeatured'),
    loadMore: t('loadMore'),
    emptyTitle: t('empty.title'),
    emptyDescription: t('empty.description'),
  };

  return (
    <>
      <main className="flex-1">
        <BlogIndex
          initialSummaries={summaries}
          featured={featured}
          pageSize={PAGE_SIZE}
          labels={labels}
        />
      </main>
      <SiteFooter />
    </>
  );
}
