'use client';

import { PlusIcon } from 'lucide-react';
import { useFormatter } from 'next-intl';
import type { ReactNode } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { BlogPostCard } from '@/shared/ui/blog-post-card';
import { BlogPostCardSkeleton } from '@/shared/ui/blog-post-card-skeleton';
import { Button } from '@/shared/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel';
import { Separator } from '@/shared/ui/separator';

import { useLatestPublishedPosts } from '../hooks/use-latest-published-posts';

export type RecentBlogPostsLabels = {
  title: string;
  read: string;
  publish: string;
  prevSlide: string;
  nextSlide: string;
  empty: string;
};

type RecentBlogPostsRailProps = {
  limit: number;
  labels: RecentBlogPostsLabels;
  /** Where the "publish a post" CTA points. Defaults to the admin blog list. */
  publishHref?: string;
};

const ITEM_CLASS = 'basis-[88%] md:basis-1/2';

/**
 * Admin-dashboard "recent posts" rail. Loads published posts on the
 * client with a matching skeleton. The header (title + "new post") always
 * shows so an admin can act even when the rail is empty.
 */
export function RecentBlogPostsRail({
  limit,
  labels,
  publishHref = '/admin/blog',
}: RecentBlogPostsRailProps) {
  const query = useLatestPublishedPosts(limit);
  const format = useFormatter();
  const posts = query.data;

  const publishButton = (
    <Button
      size="sm"
      nativeButton={false}
      render={
        <Link href={publishHref}>
          <PlusIcon data-icon="inline-start" />
          {labels.publish}
        </Link>
      }
    />
  );

  const header = (arrows: ReactNode) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          {labels.title}
        </h2>
        <div className="flex items-center gap-2">
          {arrows}
          {publishButton}
        </div>
      </div>
      <Separator />
    </div>
  );

  // Empty or failed → header (no arrows) + a branded empty box. Secondary
  // content, so a load error degrades to the same calm empty state.
  if (query.isError || (posts && posts.length === 0)) {
    return (
      <div className="flex flex-col gap-4">
        {header(null)}
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          {labels.empty}
        </div>
      </div>
    );
  }

  const arrows = (
    <div className="hidden items-center gap-1.5 md:flex">
      <CarouselPrevious
        className="static translate-x-0 translate-y-0"
        aria-label={labels.prevSlide}
      />
      <CarouselNext
        className="static translate-x-0 translate-y-0"
        aria-label={labels.nextSlide}
      />
    </div>
  );

  return (
    <Carousel
      opts={{ align: 'start' }}
      aria-label={labels.title}
      className="flex flex-col gap-4"
    >
      {header(arrows)}
      <CarouselContent>
        {query.isPending
          ? Array.from({ length: 2 }).map((_, index) => (
              <CarouselItem key={index} className={ITEM_CLASS}>
                <BlogPostCardSkeleton />
              </CarouselItem>
            ))
          : posts?.map((post, index) => (
              <CarouselItem key={post.slug} className={ITEM_CLASS}>
                <BlogPostCard
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
                  readLabel={labels.read}
                  index={index}
                />
              </CarouselItem>
            ))}
      </CarouselContent>
    </Carousel>
  );
}
