export type ProductType = 'course' | 'webinar';

export type ProductStatus = 'draft' | 'published' | 'archived' | 'banned';

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

export type WebinarDetails = {
  totalLessons: number;
  defaultDurationMinutes: number;
  allowRecording: boolean;
  defaultMaxParticipants: number | null;
  defaultStreamUrl: string | null;
  accessWindowMinutes: number | null;
};

export type Product = {
  id: string;
  type: ProductType;
  status: ProductStatus;
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
  webinarDetails: WebinarDetails | null;
  /**
   * Short-lived presigned URL for the cover image. `null` means no
   * cover is attached; the SPA should fall back to a generated
   * placeholder. The URL expires — re-fetch the product to refresh.
   */
  coverUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
