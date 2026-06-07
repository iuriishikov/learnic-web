'use client';

import { useQuery } from '@tanstack/react-query';

import { getPublishedPostAction, listPublishedPostsAction } from '../api/posts';
import { toCardData } from '../lib/to-card-data';
import type { BlogPostCardData } from '../model/types';

export const latestBlogPostsKey = (limit: number) =>
  ['publishedBlogPosts', { limit }] as const;

/**
 * Client-side loader for the latest published posts, shared by the home
 * grid and the admin dashboard rail. Fetches the index, then each post's
 * full body (for the excerpt — Variant B), and flattens to card props.
 * A failed per-post fetch degrades that card to "no excerpt" rather than
 * failing the whole query.
 */
export function useLatestPublishedPosts(limit: number) {
  return useQuery<BlogPostCardData[], Error>({
    queryKey: latestBlogPostsKey(limit),
    queryFn: async () => {
      const listed = await listPublishedPostsAction({ limit });
      if (!listed.ok) throw new Error(listed.reason);
      const full = await Promise.all(
        listed.data.map((summary) => getPublishedPostAction(summary.slug)),
      );
      return listed.data.map((summary, index) => {
        const result = full[index];
        return toCardData(summary, result.ok ? result.data : null);
      });
    },
    staleTime: 60_000,
  });
}
