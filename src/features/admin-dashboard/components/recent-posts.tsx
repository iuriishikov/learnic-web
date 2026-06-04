'use client';

import { PlusIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { BlogPostCard } from '@/shared/ui/blog-post-card';
import { Button } from '@/shared/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/ui/carousel';
import { Separator } from '@/shared/ui/separator';

import { RECENT_POSTS } from '../model/mock-data';

export function RecentPosts() {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();

  return (
    <Carousel
      opts={{ align: 'start' }}
      aria-label={t('recentPosts.title')}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">
            {t('recentPosts.title')}
          </h2>
          <div className="flex items-center gap-2">
            {/* Arrows are touch-redundant (swipe) — desktop/tablet only. */}
            <div className="hidden items-center gap-1.5 md:flex">
              <CarouselPrevious
                className="static translate-x-0 translate-y-0"
                aria-label={t('recentPosts.prevSlide')}
              />
              <CarouselNext
                className="static translate-x-0 translate-y-0"
                aria-label={t('recentPosts.nextSlide')}
              />
            </div>
            <Button
              size="sm"
              render={
                <Link href="/admin/blog">
                  <PlusIcon data-icon="inline-start" />
                  {t('recentPosts.publish')}
                </Link>
              }
            />
          </div>
        </div>
        <Separator />
      </div>

      <CarouselContent>
        {RECENT_POSTS.map((post, index) => (
          <CarouselItem key={post.id} className="basis-[88%] md:basis-1/2">
            <BlogPostCard
              title={post.title}
              description={post.description}
              author={post.author}
              category={post.category}
              date={format.dateTime(new Date(post.publishedAt), {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              imageSeed={post.imageSeed}
              readLabel={t('recentPosts.read')}
              index={index}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
