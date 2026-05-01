export type ProductType = 'course' | 'webinar';

export type ProductStatus = 'draft' | 'published' | 'archived' | 'banned';

export type Currency = 'USD' | 'EUR' | 'RUB' | 'KZT' | 'BYN';

export type ProductAuthor = {
  id: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
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
