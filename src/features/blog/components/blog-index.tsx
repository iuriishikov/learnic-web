'use client';

import { Loader2Icon, NewspaperIcon } from 'lucide-react';
import { useFormatter } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { BlogPostCard } from '@/shared/ui/blog-post-card';
import { BlogPostCardSkeleton } from '@/shared/ui/blog-post-card-skeleton';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

import { usePublishedPostsIndex } from '../hooks/use-published-posts-index';
import type { FeaturedPostData, PublishedPostSummary } from '../model/types';

import { BlogMasthead } from './blog-masthead';
import { FeaturedPost } from './featured-post';

export type BlogIndexLabels = {
  eyebrow: string;
  title: string;
  description: string;
  /** Heading above the secondary post grid (e.g. "Все материалы"). */
  allPosts: string;
  /** Grid card CTA. */
  readPost: string;
  /** Featured hero CTA. */
  readFeatured: string;
  /** "Load more" button. */
  loadMore: string;
  emptyTitle: string;
  emptyDescription: string;
};

type BlogIndexProps = {
  /** First page of published-post summaries, fetched on the server. */
  initialSummaries: PublishedPostSummary[];
  /** Enriched newest post for the lead story; `null` when there are none. */
  featured: FeaturedPostData | null;
  pageSize: number;
  labels: BlogIndexLabels;
};

const GRID_CLASS =
  'grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-16';

/**
 * Public blog index: an editorial masthead, a featured lead story, and a
 * responsive grid of the remaining posts with a "load more" control. The
 * first page is server-rendered (seeded into the infinite query); further
 * pages load on the client.
 */
export function BlogIndex({
  initialSummaries,
  featured,
  pageSize,
  labels,
}: BlogIndexProps) {
  const format = useFormatter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublishedPostsIndex(pageSize, initialSummaries);

  const summaries = data?.pages.flat() ?? initialSummaries;
  // The newest post is the lead story — keep it out of the grid below.
  const gridSummaries = summaries.slice(1);

  return (
    <div className="mx-auto w-full max-w-[1216px] px-4 py-10 md:px-6 md:py-14 lg:py-16">
      <BlogMasthead
        eyebrow={labels.eyebrow}
        title={labels.title}
        description={labels.description}
      />

      {featured ? (
        <>
          <div className="mt-10 md:mt-14 lg:mt-16">
            <FeaturedPost post={featured} readLabel={labels.readFeatured} />
          </div>

          {gridSummaries.length > 0 ? (
            <section className="mt-16 md:mt-20 lg:mt-24">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                {labels.allPosts}
              </h2>
              <Separator className="mt-4" />

              <div className={cn(GRID_CLASS, 'mt-8 md:mt-10')}>
                {gridSummaries.map((post, index) => (
                  <BlogPostCard
                    key={post.slug}
                    title={post.title}
                    date={
                      post.publishedAt
                        ? format.dateTime(new Date(post.publishedAt), {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : ''
                    }
                    href={`/blog/${post.slug}`}
                    coverUrl={post.cover?.url ?? null}
                    imageSeed={post.slug}
                    readLabel={labels.readPost}
                    // Stagger within each row only — a full-list cascade would
                    // shimmer against the scroll on long indexes.
                    index={index % 3}
                  />
                ))}
                {isFetchingNextPage
                  ? Array.from({ length: pageSize }).map((_, i) => (
                      <BlogPostCardSkeleton key={`pending-${i}`} />
                    ))
                  : null}
              </div>

              {hasNextPage ? (
                <div className="mt-12 flex justify-center md:mt-16">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <Loader2Icon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : null}
                    {labels.loadMore}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      ) : (
        <BlogEmptyState
          title={labels.emptyTitle}
          description={labels.emptyDescription}
        />
      )}
    </div>
  );
}

function BlogEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center md:mt-14 md:py-24">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <NewspaperIcon className="size-6" aria-hidden />
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
