import { htmlToExcerpt } from '@/shared/lib/html-excerpt';

import type {
  FeaturedPostData,
  PublishedPost,
  PublishedPostSummary,
} from '../model/types';

/**
 * Flatten a full post into the index lead-story shape. The excerpt prefers
 * the editorial subtitle and falls back to the first non-empty HTML block
 * distilled to plain text — the same rule the post page uses for its meta
 * description.
 */
export function toFeatured(post: PublishedPost): FeaturedPostData {
  const firstHtml = post.blocks.find(
    (block) => block.type === 'html' && block.html.trim().length > 0,
  );
  const excerpt =
    post.subtitle ??
    (firstHtml && firstHtml.type === 'html' ? htmlToExcerpt(firstHtml.html) : '');

  return {
    slug: post.slug,
    title: post.title,
    topic: post.topic,
    excerpt,
    publishedAt: post.publishedAt,
    coverUrl: post.cover?.url ?? null,
    author: post.author,
  };
}

/**
 * Degraded lead story built from a summary alone — used when the newest
 * post's full body fails to load. The hero still renders (cover, title,
 * date); only the topic/excerpt/author enrichments are absent.
 */
export function toFeaturedFromSummary(
  summary: PublishedPostSummary,
): FeaturedPostData {
  return {
    slug: summary.slug,
    title: summary.title,
    topic: null,
    excerpt: '',
    publishedAt: summary.publishedAt,
    coverUrl: summary.cover?.url ?? null,
    author: null,
  };
}
