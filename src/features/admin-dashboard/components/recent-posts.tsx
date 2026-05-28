'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { BlogPostCard } from '@/shared/ui/blog-post-card';

import { RECENT_POSTS } from '../model/mock-data';
import { SectionHeader } from './section-header';

export function RecentPosts() {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t('recentPosts.title')} />
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
        {RECENT_POSTS.map((post, index) => (
          <BlogPostCard
            key={post.id}
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
        ))}
      </div>
    </section>
  );
}
