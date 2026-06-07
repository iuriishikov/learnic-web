'use client';

import { useFormatter } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { BlogPostCard } from '@/shared/ui/blog-post-card';
import { BlogPostCardSkeleton } from '@/shared/ui/blog-post-card-skeleton';
import { Button } from '@/shared/ui/button';

import { useLatestPublishedPosts } from '../hooks/use-latest-published-posts';

export type LatestBlogPostsLabels = {
  eyebrow: string;
  title: string;
  description: string;
  viewAll: string;
  readLabel: string;
};

type LatestBlogPostsSectionProps = {
  limit: number;
  labels: LatestBlogPostsLabels;
  /** Where the "view all" CTA points. Defaults to the public blog index. */
  viewAllHref?: string;
};

const GRID_CLASS =
  'mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-16';

/**
 * Home-page "latest from the blog" section. Loads published posts on the
 * client with a matching skeleton; renders nothing at all when there are
 * no posts (or the load fails) so the landing page never shows an empty
 * blog block.
 */
export function LatestBlogPostsSection({
  limit,
  labels,
  viewAllHref = '/blog',
}: LatestBlogPostsSectionProps) {
  const query = useLatestPublishedPosts(limit);
  const format = useFormatter();

  // Secondary content: a failed load hides the section rather than
  // taking down the landing page.
  if (query.isError) return null;
  const posts = query.data;
  // Loaded and empty → don't render the section at all.
  if (posts && posts.length === 0) return null;

  const isLoading = query.isPending;

  return (
    <section className="w-full py-10 md:py-14 lg:py-16">
      <div className="mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-10">
          <div className="flex flex-col gap-4 md:max-w-[720px]">
            <span className="text-sm font-semibold text-brand">
              {labels.eyebrow}
            </span>
            <h2 className="text-pretty text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-[40px] lg:leading-[1.15]">
              {labels.title}
            </h2>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {labels.description}
            </p>
          </div>
          <Button
            className="h-11 w-fit gap-2 rounded-lg bg-brand px-5 text-base font-medium text-brand-foreground hover:bg-brand/90 md:mt-2"
            render={<Link href={viewAllHref} />}
            nativeButton={false}
          >
            {labels.viewAll}
          </Button>
        </div>

        <div className={GRID_CLASS}>
          {isLoading
            ? Array.from({ length: limit }).map((_, index) => (
                <BlogPostCardSkeleton key={index} />
              ))
            : posts?.map((post, index) => (
                <BlogPostCard
                  key={post.slug}
                  title={post.title}
                  description={post.excerpt}
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
                  coverUrl={post.coverUrl}
                  imageSeed={post.slug}
                  readLabel={labels.readLabel}
                  index={index}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
