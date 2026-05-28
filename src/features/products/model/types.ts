import type { Tag } from '@/features/product-tags';
import type { ApiFile } from '@/shared/types/user';

export type ProductType = 'course';

export type ProductStatus = 'draft' | 'published' | 'archived' | 'banned';

/**
 * Enrollment visibility, orthogonal to {@link ProductStatus}. Both
 * `public` and `private` products appear in the catalog/search and on
 * their detail page; the difference is enrollment. `public` accepts
 * self-enrollment; `private` is invite-only — self-enroll is refused
 * and access is granted only through an accepted gift. The SPA should
 * hide the self-enroll CTA when `private`. Owner-only to toggle
 * (`PATCH /products/{id}/visibility`).
 */
export type ProductVisibility = 'public' | 'private';

// `Currency` lives in `@/shared/types/money` — cross-cutting; wallet
// and order UI consume the same union. Products themselves no longer
// store currency (denominated in the owner's account currency, RUB-only
// at this phase) — re-exported here only for legacy consumers.
export type { Currency } from '@/shared/types/money';

export type ProductAuthor = {
  id: string;
  /** Display name in the canonical `Last First Patronymic` order. */
  fullName: string;
  /**
   * Privacy-masked email in the form `f*****d@domain.com`. May be an
   * empty string in the rare placeholder case where the backend could
   * not hydrate the underlying user — fall back to `fullName`.
   */
  email: string;
};

export type Product = {
  id: string;
  type: ProductType;
  status: ProductStatus;
  /** Discovery visibility (public vs invite-only). See {@link ProductVisibility}. */
  visibility: ProductVisibility;
  title: string;
  description: string;
  durationHours: number;
  /**
   * Current price in minor units (kopecks for RUB), or `null` for
   * products that have never had a price set (DRAFT products start
   * without one). Currency is implicit — products are denominated
   * in the owner's account currency (RUB-only at this phase).
   */
  priceAmount: number | null;
  author: ProductAuthor;
  /**
   * Resolved cover file with a short-lived presigned URL, or `null`
   * when no cover is attached (the SPA falls back to a generated
   * placeholder). The URL expires — re-fetch the product to refresh.
   */
  cover: ApiFile | null;
  /**
   * Product tags in author-defined order, embedded inline by the
   * backend so cards/details render chips without an extra
   * `GET /products/{id}/tags` round-trip. The editor still uses
   * `useProductTags` because it owns optimistic mutations.
   */
  tags: Tag[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
