'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { listPublishedPostsAction } from '../api/posts';
import type { PublishedPostSummary } from '../model/types';

export const publishedPostsIndexKey = (pageSize: number) =>
  ['publishedBlogPostsIndex', { pageSize }] as const;

/**
 * Paginated loader for the public blog index. Seeded with the first page
 * rendered on the server (so the initial paint needs no client fetch), it
 * appends further pages on demand for the "load more" control. A page that
 * comes back shorter than `pageSize` is the last one — `getNextPageParam`
 * then returns `undefined` and the control hides itself.
 */
export function usePublishedPostsIndex(
  pageSize: number,
  initialSummaries: PublishedPostSummary[],
) {
  return useInfiniteQuery({
    queryKey: publishedPostsIndexKey(pageSize),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await listPublishedPostsAction({
        offset: pageParam,
        limit: pageSize,
      });
      if (!res.ok) throw new Error(res.reason);
      return res.data;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === pageSize ? allPages.length * pageSize : undefined,
    initialData: {
      pages: [initialSummaries],
      pageParams: [0],
    },
    staleTime: 60_000,
  });
}
