'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

import type { Product } from '../model/types';

import { ProductCardSkeleton } from './product-card-skeleton';

type ProductResultsGridProps = {
  /** Products to render. While ``showSkeleton`` is true these are the
   *  previous (kept) items — used only to size the skeleton fill so the
   *  grid height doesn't jump. */
  items: Product[];
  /** Render layout-matching skeletons instead of the grid. */
  showSkeleton: boolean;
  /** Per-page count — skeleton fill fallback on a cold load with no
   *  items to mirror. */
  perPage: number;
  /** Per-card renderer. Must return an element whose hooks live inside
   *  it (called once per item, not in a loop callback). */
  renderItem: (product: Product) => ReactNode;
  /** Empty state — shown when not loading and there are no items. */
  empty: ReactNode;
  /** Grid track classes — shared by the skeleton and the real grid so
   *  the two line up exactly (no shift on data arrival). */
  gridClassName: string;
  /** Pagination node, rendered below the grid. The caller decides when
   *  to pass it (typically ``total > 0``). */
  pagination?: ReactNode;
};

/**
 * Loading-aware product grid shared by the marketplace and the teach
 * "my products" catalog. Owns the skeleton / empty / animated-grid
 * switch and the per-card motion wrapper; the surrounding chrome (hero,
 * tabs, tag row, create CTA) and the card itself stay with each view.
 *
 * The skeleton and the real grid use the same ``gridClassName`` so the
 * placeholder matches the content and data arrival causes no layout
 * shift.
 */
export function ProductResultsGrid({
  items,
  showSkeleton,
  perPage,
  renderItem,
  empty,
  gridClassName,
  pagination,
}: ProductResultsGridProps) {
  const reduceMotion = useReducedMotion();

  // Mirror the count currently on screen so the grid height holds when
  // we swap to skeletons mid-navigation; fall back to a sensible fill on
  // the cold load where there's nothing to mirror.
  const skeletonCount =
    items.length > 0 ? items.length : Math.min(perPage, 6);

  return (
    <>
      {showSkeleton ? (
        <ul aria-hidden className={gridClassName}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        empty
      ) : (
        <ul className={gridClassName}>
          {/* Opacity-only enter/exit + ``layout`` so filter changes
              (search query + tag toggle) animate smoothly: items being
              filtered out fade and the rest reflow into the gap.
              ``initial={false}`` suppresses the fade on first paint. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {items.map((product) => (
              <motion.li
                key={product.id}
                layout={reduceMotion ? false : true}
                initial={reduceMotion ? undefined : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                {renderItem(product)}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {pagination}
    </>
  );
}

export type { ProductResultsGridProps };
