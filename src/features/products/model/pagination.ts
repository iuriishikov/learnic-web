// Plain TS module — no ``'use client'`` directive — so these
// constants can be imported from Server Components (page.tsx,
// loading.tsx, layout.tsx) too. Re-exported from the client-side
// ``use-published-products.ts`` hook for in-component use.
//
// Background: under Next 16 RSC, every export from a ``'use client'``
// module becomes an opaque client-bound reference. A Server
// Component reading ``PUBLISHED_PRODUCTS_PAGE_SIZE`` from such a
// module sees an error-throwing function stub, not the number —
// which then leaks into URL query strings (``limit=function(){...}``)
// and crashes the backend with 422.

export const PUBLISHED_PRODUCTS_PAGE_SIZE = 12;

// Per-page options exposed in the marketplace footer picker. Top
// option matches the backend's ``MAX_LIMIT = 100``; bumping that
// requires a coordinated backend change.
export const PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS = [12, 24, 48, 96] as const;

// "My notes" reuses the marketplace pagination shape end-to-end
// (numbered controls + URL-driven page/perPage/q). Backend caps at
// ``MAX_LIMIT = 100`` — the top option here mirrors that.
export const MY_PRODUCTS_PAGE_SIZE = 12;
export const MY_PRODUCTS_PER_PAGE_OPTIONS = [12, 24, 48, 96] as const;

// A user's public products on their profile (``GET /users/{id}/products``).
// That endpoint returns a bare array with no ``X-Total-Count`` header, so
// numbered "page X of Y" controls aren't possible — the profile uses a
// "load more" infinite-query control instead, which only needs a page size.
export const USER_PRODUCTS_PAGE_SIZE = 12;
