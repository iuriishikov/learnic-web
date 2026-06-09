import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { cache } from 'react';

import { BlogPostView, getPublishedPostAction } from '@/features/blog';
import { htmlToExcerpt } from '@/shared/lib/html-excerpt';
import { SiteFooter } from '@/widgets/site-footer';

type BlogPostPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

// Dedupe the fetch across `generateMetadata` + the page render within one
// request — both run in the same render pass, so React `cache` collapses
// them into a single backend call.
const loadPost = cache((slug: string) => getPublishedPostAction(slug));

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPost(slug);
  if (!result.ok) return {};

  const post = result.data;
  const firstHtml = post.blocks.find(
    (block) => block.type === 'html' && block.html.trim().length > 0,
  );
  const description =
    post.subtitle ??
    (firstHtml && firstHtml.type === 'html'
      ? htmlToExcerpt(firstHtml.html)
      : undefined);

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      images: post.cover ? [{ url: post.cover.url }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const result = await loadPost(slug);
  if (!result.ok) {
    if (result.reason === 'not-found') notFound();
    throw new Error(`Failed to load blog post "${slug}": ${result.reason}`);
  }

  return (
    <>
      <main className="flex-1">
        <BlogPostView post={result.data} />
      </main>
      <SiteFooter />
    </>
  );
}
