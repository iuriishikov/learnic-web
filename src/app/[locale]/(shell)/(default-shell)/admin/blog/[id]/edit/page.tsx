import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { PostEditorView, getPostAction } from '@/features/blog-admin';
import { httpStatusForReason } from '@/shared/lib/http-error';

type EditPostPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getPostAction(id);
  if (!result.ok) {
    // Missing post → 404 page; auth → 403; anything else → 500 boundary.
    if (result.reason === 'not-found') notFound();
    throw httpStatusForReason(
      result.reason === 'unauthorized' ? 'forbidden' : 'unknown',
      `Failed to load blog post ${id}`,
    );
  }

  return <PostEditorView initialPost={result.data} />;
}
