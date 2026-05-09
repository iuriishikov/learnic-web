export type ProductType = 'course' | 'webinar';

export type ProductStatus = 'draft' | 'published' | 'archived' | 'banned';

export type Currency = 'USD' | 'EUR' | 'RUB' | 'KZT' | 'BYN';

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
  priceAmount: string;
  priceCurrency: Currency;
  author: ProductAuthor;
  webinarDetails: WebinarDetails | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
