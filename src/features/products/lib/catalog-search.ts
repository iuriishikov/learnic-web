// Shared pure helpers for the URL-driven product catalog surfaces
// (marketplace + teach "my products"). No ``'use client'`` — these are
// plain functions consumed by the client hook/view and (for
// ``readUrlNumber``) safe anywhere.

/**
 * Parse a numeric URL param, clamped to ``[min, max]``. Falls back to
 * ``fallback`` when the param is absent or not a finite integer — the
 * SSR-resolved value that ``page.tsx`` already computed, so the first
 * client read matches the server render with no hydration shift.
 */
export function readUrlNumber(
  raw: string | null,
  fallback: number,
  min: number,
  max?: number,
): number {
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return max !== undefined
    ? Math.min(Math.max(parsed, min), max)
    : Math.max(parsed, min);
}

/**
 * Whether a catalog grid should render layout-matching skeletons.
 *
 * The dominant trigger is ``isPending`` — the RSC navigation that a
 * search/paginate/filter URL push kicks off (``router.replace`` re-runs
 * ``page.tsx`` server-side and hands back fresh ``initialData``, so React
 * Query never enters a placeholder state; that server round-trip is the
 * real wait). The React Query part (``isPlaceholderData`` / ``!hasData``)
 * is a fallback for any client-only fetch that bypasses navigation. The
 * SSR-hydrated first paint has fresh ``initialData`` and no pending
 * transition, so the initial render stays skeleton-free.
 */
export function shouldShowCatalogSkeleton(state: {
  isPending: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  hasData: boolean;
}): boolean {
  return (
    state.isPending ||
    (state.isFetching && (state.isPlaceholderData || !state.hasData))
  );
}
