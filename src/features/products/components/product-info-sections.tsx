'use client';

import type { ComponentType } from 'react';

import type { Product, ProductType } from '../model/types';

import { ProductNoteStructure } from './product-note-structure';

type ProductInfoSection = ComponentType<{ product: Product }>;

/**
 * Type-specific preview blocks rendered below the shared product fields on
 * the info page — the per-type extension point. Mirrors the editor's
 * {@link import('../model/sections').SECTIONS_BY_PRODUCT_TYPE} registry: each
 * product type maps to the ordered extra sections its preview shows.
 *
 * To give a new product type its own preview blocks:
 *   1. add the variant to `ProductType` (`model/types.ts`),
 *   2. build a `({ product }) => …` section component (gate it on its own
 *      data presence so a missing block renders nothing),
 *   3. register it here — the `Record<ProductType, …>` won't compile until
 *      every type is covered, so a new type can't silently ship with no
 *      type-specific section list.
 */
const INFO_SECTIONS_BY_PRODUCT_TYPE: Record<
  ProductType,
  readonly ProductInfoSection[]
> = {
  note: [ProductNoteStructure],
};

export function ProductInfoTypeSections({ product }: { product: Product }) {
  const sections = INFO_SECTIONS_BY_PRODUCT_TYPE[product.type];
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((Section, index) => (
        <Section key={index} product={product} />
      ))}
    </>
  );
}
