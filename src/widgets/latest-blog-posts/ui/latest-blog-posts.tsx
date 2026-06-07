import { getTranslations } from 'next-intl/server';

import { LatestBlogPostsSection } from '@/features/blog';

/** Home page shows the three newest published posts. */
const LATEST_BLOG_LIMIT = 3;

/**
 * Thin server wrapper: reads the home blog-section copy and hands it to
 * the client section, which loads real published posts (with a skeleton)
 * and renders nothing when there are none.
 */
export async function LatestBlogPosts() {
  const t = await getTranslations('home.blog');

  return (
    <LatestBlogPostsSection
      limit={LATEST_BLOG_LIMIT}
      labels={{
        eyebrow: t('eyebrow'),
        title: t('title'),
        description: t('description'),
        viewAll: t('viewAll'),
        readLabel: t('readPost'),
      }}
    />
  );
}
