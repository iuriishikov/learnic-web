import { htmlToExcerpt } from '@/shared/lib/html-excerpt';

import type {
  BlogPostCardData,
  PublishedPost,
  PublishedPostSummary,
} from '../model/types';

/**
 * Flatten a summary (+ optionally its full post) into card props. The
 * excerpt is derived from the post's first non-empty HTML block (Variant
 * B). When the full post is unavailable (a failed per-post fetch), the
 * card still renders from the summary — just without an excerpt.
 */
export function toCardData(
  summary: PublishedPostSummary,
  full: PublishedPost | null,
): BlogPostCardData {
  const firstHtml = full?.blocks.find(
    (block) => block.type === 'html' && block.html.trim().length > 0,
  );
  const excerpt =
    firstHtml && firstHtml.type === 'html' ? htmlToExcerpt(firstHtml.html) : '';

  return {
    slug: summary.slug,
    title: summary.title,
    publishedAt: summary.publishedAt,
    excerpt,
    coverUrl: summary.cover?.url ?? null,
  };
}
