'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
} from '../model/pagination';
import type { Product } from '../model/types';

import { getPublishedProductsAction } from './get-published-action';

// Re-export the model constants so existing client callers can keep
// importing them from this hook module. Server Components should
// import directly from ``../model/pagination`` (or via the feature
// barrel) to avoid the client-bound reference trap — see the note
// in ``model/pagination.ts``.
export {
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
};

// Mirror of backend ``SEARCH_QUERY_MIN_LEN`` — sub-2-char queries
// are rejected at the API boundary, so the client never sends them.
const SEARCH_QUERY_MIN_LEN = 2;

export type PublishedProductsPage = {
  products: Product[];
  total: number;
};

export const publishedProductsKey = (
  page: number,
  perPage: number,
  q?: string,
  tagIds: string[] = [],
) => {
  const trimmed = q?.trim() ?? '';
  // Sort tag ids so selection order doesn't fragment the cache — the
  // filter is an order-independent AND on the backend. ``q`` / ``tags``
  // are added only when present so the no-filter key stays
  // byte-identical to the legacy ``{ page, perPage }`` shape.
  const tags = [...tagIds].sort();
  const filters: {
    page: number;
    perPage: number;
    q?: string;
    tags?: string[];
  } = { page, perPage };
  if (trimmed.length >= SEARCH_QUERY_MIN_LEN) filters.q = trimmed;
  if (tags.length > 0) filters.tags = tags;
  return ['products', 'published', filters] as const;
};

export function usePublishedProducts(args: {
  page: number;
  perPage: number;
  q?: string;
  tagIds?: string[];
  initialPage?: PublishedProductsPage;
}) {
  const { page, perPage, q, tagIds = [], initialPage } = args;
  const trimmed = q?.trim() ?? '';
  const hasSearch = trimmed.length >= SEARCH_QUERY_MIN_LEN;
  const effectiveQ = hasSearch ? trimmed : undefined;

  return useQuery<PublishedProductsPage, Error>({
    queryKey: publishedProductsKey(page, perPage, effectiveQ, tagIds),
    queryFn: async () => {
      const result = await getPublishedProductsAction({
        offset: (page - 1) * perPage,
        limit: perPage,
        q: effectiveQ,
        tagIds,
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
    // shadcn ``Pagination`` UX expectation.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
