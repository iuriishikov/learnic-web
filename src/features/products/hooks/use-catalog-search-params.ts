'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

import { usePathname, useRouter } from '@/shared/config/i18n/navigation';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import { readUrlNumber } from '../lib/catalog-search';

// Mirror of the backend ``SEARCH_QUERY_MIN_LEN`` — sub-2-char queries
// are rejected at the API boundary, so we never push them to the URL
// (and never send them to the backend).
const SEARCH_QUERY_MIN_LEN = 2;

type CatalogPush = {
  /** Target page. ``1`` clears the ``page`` param. */
  page: number;
  /** Override per-page. Defaults to the current URL ``perPage``. */
  perPage?: number;
  /**
   * Override the search query. Omit to preserve the current URL ``q``
   * (e.g. paginating within an active search). Pass ``null`` to clear it.
   */
  q?: string | null;
  /**
   * Arbitrary extra params to set (truthy) or delete (``null``). Params
   * not listed here are preserved as-is — so paginating/searching keeps
   * an active ``?tags=`` filter, while a tag toggle passes
   * ``{ tags: 'a,b' }`` (or ``{ tags: null }`` to clear).
   */
  extra?: Record<string, string | null>;
};

export type CatalogSearchParams = {
  /** Live input value (updates per keystroke). */
  search: string;
  setSearch: (next: string) => void;
  /** Debounced input — what actually drives the URL/backend query. */
  debouncedSearch: string;
  /** Resolved URL state (mirrors SSR values on first paint). */
  urlPage: number;
  urlPerPage: number;
  urlQuery: string;
  /**
   * True while a search/paginate/filter navigation is in flight — the
   * primary signal a catalog grid uses to show skeletons.
   */
  isPending: boolean;
  /** Push new catalog URL state (wrapped in a transition). */
  push: (next: CatalogPush) => void;
};

/**
 * URL-driven paged-search engine shared by the marketplace and the teach
 * "my products" catalog. Owns ``page``/``perPage``/``q`` as URL state,
 * debounces the search input into a URL push, and exposes ``isPending``
 * (from ``useTransition``) so both grids skeleton on every navigation.
 *
 * Feature-specific filters (the marketplace ``?tags=``) are read in the
 * view and threaded through ``push({ extra })`` — they ride along on
 * search/paginate pushes automatically because ``push`` preserves any
 * param it isn't told to change.
 */
export function useCatalogSearchParams(opts: {
  initialPage: number;
  initialPerPage: number;
  initialQuery: string;
  /** Default page size — when ``perPage`` equals it, the param is dropped. */
  pageSize: number;
  /** Largest selectable per-page (clamps a hand-edited URL). */
  perPageMax: number;
}): CatalogSearchParams {
  const { initialPage, initialPerPage, initialQuery, pageSize, perPageMax } =
    opts;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const urlPage = readUrlNumber(searchParams.get('page'), initialPage, 1);
  const urlPerPage = readUrlNumber(
    searchParams.get('perPage'),
    initialPerPage,
    1,
    perPageMax,
  );
  const urlQuery = searchParams.get('q') ?? initialQuery ?? '';

  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(search, 250);

  const push = useCallback(
    (next: CatalogPush) => {
      const params = new URLSearchParams(searchParams.toString());
      const perPage = next.perPage ?? urlPerPage;
      // Omitted ``q`` preserves the active query (normalised to null
      // below 2 chars); explicit ``null`` clears it.
      const rawQ =
        next.q !== undefined
          ? next.q
          : urlQuery.trim().length >= SEARCH_QUERY_MIN_LEN
            ? urlQuery.trim()
            : null;
      const q = rawQ && rawQ.trim().length >= SEARCH_QUERY_MIN_LEN ? rawQ.trim() : null;

      if (next.page === 1) params.delete('page');
      else params.set('page', String(next.page));

      if (perPage === pageSize) params.delete('perPage');
      else params.set('perPage', String(perPage));

      if (q) params.set('q', q);
      else params.delete('q');

      if (next.extra) {
        for (const [key, value] of Object.entries(next.extra)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
      }

      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      // Hold ``isPending`` for the whole server round-trip so grids show
      // skeletons until the new page/query/filters are ready.
      startTransition(() => router.replace(href));
    },
    [router, pathname, searchParams, urlPerPage, urlQuery, pageSize],
  );

  // Push when the debounced search diverges from the URL — resets to
  // page 1 since "page 5 of a different query" is meaningless.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlQuery.trim()) return;
    push({
      page: 1,
      q: trimmed.length >= SEARCH_QUERY_MIN_LEN ? trimmed : null,
    });
    // Only re-run when the debounced value settles; ``push``/``urlQuery``
    // are intentionally excluded to avoid a feedback loop on every nav.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return {
    search,
    setSearch,
    debouncedSearch,
    urlPage,
    urlPerPage,
    urlQuery,
    isPending,
    push,
  };
}
