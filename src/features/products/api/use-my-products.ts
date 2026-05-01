'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import type { Product } from '../model/types';

import { getMyProductsAction } from './get-my-products-action';

export const MY_PRODUCTS_PAGE_SIZE = 20;

export const myProductsKey = ['products', 'mine'] as const;

export function useMyProducts(initialPage: Product[]) {
  return useInfiniteQuery({
    queryKey: myProductsKey,
    queryFn: async ({ pageParam }) => {
      const result = await getMyProductsAction({
        offset: pageParam,
        limit: MY_PRODUCTS_PAGE_SIZE,
      });
      if (!result.ok) throw new Error(result.reason);
      return result.products;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Backend doesn't return a total count — assume more rows exist while
      // the last page is full, stop when it returns less than the page size.
      if (lastPage.length < MY_PRODUCTS_PAGE_SIZE) return undefined;
      return allPages.reduce((acc, p) => acc + p.length, 0);
    },
    initialData:
      initialPage.length > 0
        ? { pages: [initialPage], pageParams: [0] }
        : undefined,
  });
}
