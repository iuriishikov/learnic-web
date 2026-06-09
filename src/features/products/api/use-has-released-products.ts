'use client';

import { useQuery } from '@tanstack/react-query';

import { getUserProductsAction } from './get-user-products-action';

// Base prefix for every "released by author" probe. The release-creation
// flow invalidates this prefix on the first-release → published flip so
// the gate flips to `true` without waiting out `staleTime` — see
// `useCreateNoteReleaseMutation`.
export const releasedByAuthorKey = ['products', 'released-by-author'] as const;

// Keyed by author so distinct users don't share a cached answer. The
// trailing ``has-any`` marks this as the boolean existence probe (a
// ``limit: 1`` fetch), distinct from any future paged listing of the
// same author's released products.
export const hasReleasedProductsKey = (userId: string) =>
  [...releasedByAuthorKey, userId, 'has-any'] as const;

/**
 * Whether ``userId`` has at least one product they released themselves —
 * i.e. `GET /users/{user_id}/products` (PUBLISHED, author-scoped) returns
 * a non-empty list. A note becomes PUBLISHED only by creating its first
 * release, so this is exactly "has shipped a note."
 *
 * Used by the user-menu to gate the storage-quota meter: storage is a
 * creator-only concern, so learners who have never released anything see
 * neither the meter nor its WebSocket connection.
 *
 * The hook returns the raw query; callers should default to ``false``
 * while ``data`` is undefined so the meter never flashes for someone who
 * turns out to have nothing released.
 */
export function useHasReleasedProducts(userId: string) {
  return useQuery<boolean, Error>({
    queryKey: hasReleasedProductsKey(userId),
    queryFn: async () => {
      // Only existence matters — one row is enough to answer the gate.
      const result = await getUserProductsAction({ userId, limit: 1 });
      if (!result.ok) throw new Error(result.reason);
      return result.products.length > 0;
    },
    // Releasing a first product is rare relative to menu opens, and the
    // answer only decides whether to render a meter — a few minutes of
    // staleness is harmless.
    staleTime: 5 * 60_000,
  });
}
