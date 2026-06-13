'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { getUserProductsAction, type Product } from '@/features/products';

export const userProductsKey = (userId: string, pageSize: number) =>
  ['userProducts', { userId, pageSize }] as const;

/**
 * Paginated loader for a user's published products on their public profile.
 *
 * The backend endpoint (`GET /users/{id}/products`) returns a bare array with
 * no total-count header, so there's nothing to drive numbered controls — this
 * loads pages on demand for a "load more" button instead. A page shorter than
 * `pageSize` is the last one (`getNextPageParam` → `undefined`, the control
 * hides itself). Seeded with the first page rendered on the server so the
 * initial paint needs no client fetch.
 */
export function useUserProducts(
  userId: string,
  pageSize: number,
  initialProducts: Product[],
) {
  return useInfiniteQuery({
    queryKey: userProductsKey(userId, pageSize),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await getUserProductsAction({
        userId,
        offset: pageParam,
        limit: pageSize,
      });
      if (!res.ok) throw new Error(res.reason);
      return res.products;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === pageSize ? allPages.length * pageSize : undefined,
    initialData: {
      pages: [initialProducts],
      pageParams: [0],
    },
    staleTime: 60_000,
  });
}
