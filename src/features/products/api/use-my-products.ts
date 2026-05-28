'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  MY_PRODUCTS_PAGE_SIZE,
  MY_PRODUCTS_PER_PAGE_OPTIONS,
} from '../model/pagination';
import type { Product } from '../model/types';

import { getMyProductsAction } from './get-my-products-action';

// Re-export the model constants so existing client callers can keep
// importing them from this hook module. Server Components should
// import directly from ``../model/pagination`` (or via the feature
// barrel) — see the note in ``model/pagination.ts``.
export {
  MY_PRODUCTS_PAGE_SIZE,
  MY_PRODUCTS_PER_PAGE_OPTIONS,
};

// Mirror of backend ``SEARCH_QUERY_MIN_LEN`` — sub-2-char queries
// are rejected at the API boundary, so the client never sends them.
const SEARCH_QUERY_MIN_LEN = 2;

export type MyProductsPage = {
  products: Product[];
  total: number;
};

// Prefix used by ``invalidateQueries`` on every mutation that
// touches the caller's accessible set (create/archive/unarchive/
// delete/publish). Every paged query key starts with this prefix,
// so a prefix match invalidates the whole set.
export const myProductsKey = ['products', 'mine'] as const;

export const myProductsPagedKey = (
  page: number,
  perPage: number,
  q?: string,
) => {
  const trimmed = q?.trim() ?? '';
  return trimmed.length >= SEARCH_QUERY_MIN_LEN
    ? ([...myProductsKey, { page, perPage, q: trimmed }] as const)
    : ([...myProductsKey, { page, perPage }] as const);
};

export function useMyProducts(args: {
  page: number;
  perPage: number;
  q?: string;
  initialPage?: MyProductsPage;
}) {
  const { page, perPage, q, initialPage } = args;
  const trimmed = q?.trim() ?? '';
  const hasSearch = trimmed.length >= SEARCH_QUERY_MIN_LEN;
  const effectiveQ = hasSearch ? trimmed : undefined;

  return useQuery<MyProductsPage, Error>({
    queryKey: myProductsPagedKey(page, perPage, effectiveQ),
    queryFn: async () => {
      const result = await getMyProductsAction({
        offset: (page - 1) * perPage,
        limit: perPage,
        q: effectiveQ,
      });
      if (!result.ok) throw new Error(result.reason);
      return { products: result.products, total: result.total };
    },
    // SSR-hydrated initial page lives at the URL the page.tsx
    // resolved with — only used when the active query key matches
    // that page+perPage+q (handled at the call site).
    initialData: initialPage,
    // Keep the previous page visible while the next one loads —
    // avoids a blank grid flash on prev/next clicks. Matches the
    // marketplace pagination UX.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
