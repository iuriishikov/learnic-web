import { setRequestLocale } from 'next-intl/server';

import { PostsListView, listPostsAction } from '@/features/blog-admin';
import { httpStatusForReason } from '@/shared/lib/http-error';

type BlogListPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function BlogListPage({ params }: BlogListPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Admin gating is inherited from the `admin/layout.tsx` 403 gate.
  const result = await listPostsAction({ offset: 0, limit: 20 });
  if (!result.ok) {
    throw httpStatusForReason(
      result.reason === 'unauthorized' ? 'forbidden' : 'unknown',
      'Failed to load blog posts',
    );
  }

  return <PostsListView initialPage={result.data} />;
}
