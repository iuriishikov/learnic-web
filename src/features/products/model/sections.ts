import type { ProductType } from './types';

/**
 * Every section ("tab") the product editor knows how to render. A section
 * key here is only a *capability* — whether a given product type actually
 * shows it is decided by {@link SECTIONS_BY_PRODUCT_TYPE}. The matching
 * body lives in the renderer switch inside `product-editor-view.tsx`
 * (a key with no body falls back to the `sectionPlaceholder` state).
 *
 * Labels come from `teach-products.editor.sections.<key>` (ru + en).
 */
export const PRODUCT_SECTION_KEYS = [
  'content',
  'description',
  'team',
  'settings',
] as const;

export type ProductSectionKey = (typeof PRODUCT_SECTION_KEYS)[number];

/**
 * Ordered sections shown in the editor, per product type. The array order
 * is the tab order (sidebar + mobile nav), and the **first** entry is the
 * default-selected section on open — hence the non-empty tuple type, so a
 * type can never be configured with zero sections.
 *
 * To give a new product type its own tabs:
 *   1. add the variant to `ProductType` (`model/types.ts`),
 *   2. add its ordered section list here (TypeScript forces this — the
 *      `Record<ProductType, …>` won't compile until every type is covered),
 *   3. if the type introduces a *new* section key, add it to
 *      `PRODUCT_SECTION_KEYS`, its label to the i18n `sections` map, and a
 *      body branch in `product-editor-view.tsx`.
 */
export const SECTIONS_BY_PRODUCT_TYPE: Record<
  ProductType,
  readonly [ProductSectionKey, ...ProductSectionKey[]]
> = {
  course: ['content', 'description', 'team', 'settings'],
};
