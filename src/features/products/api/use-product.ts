'use client';

import { useQuery } from '@tanstack/react-query';

import type { Product } from '../model/types';

import { getProductByIdAction } from './get-product-by-id-action';

export const productKey = (productId: string) =>
  ['product', productId] as const;

/**
 * Live product query backed by the server action. Pass the server-rendered
 * `Product` as `initialData` so the page paints from the SSR snapshot and the
 * client only refetches when the cache goes stale (e.g. after a mutation
 * invalidation).
 */
export function useProductQuery(productId: string, initialData?: Product) {
  return useQuery<Product, Error>({
    queryKey: productKey(productId),
    queryFn: async () => {
      const result = await getProductByIdAction(productId);
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    initialData:
      initialData && initialData.id === productId ? initialData : undefined,
    staleTime: 60_000,
  });
}
