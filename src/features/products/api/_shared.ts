import type {
  Currency,
  Product,
  ProductAuthor,
  ProductStatus,
  ProductType,
  WebinarDetails,
} from '../model/types';

type AuthorSchemaResponse = {
  oid: string;
  first_name: string;
  last_name: string;
  patronymic: string | null;
};

type WebinarDetailsSchemaResponse = {
  total_lessons: number;
  default_duration_minutes: number;
  allow_recording: boolean;
  default_max_participants: number | null;
  default_stream_url: string | null;
  access_window_minutes: number | null;
};

export type ProductSchemaResponse = {
  oid: string;
  type: ProductType;
  status: ProductStatus;
  name: string;
  description: string | null;
  total_duration_in_hours: number | null;
  price_amount: string | null;
  price_currency: Currency;
  author: AuthorSchemaResponse;
  webinar_details: WebinarDetailsSchemaResponse | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function fromProductSchema(raw: ProductSchemaResponse): Product {
  return {
    id: raw.oid,
    type: raw.type,
    status: raw.status,
    title: raw.name,
    description: raw.description ?? '',
    durationHours: raw.total_duration_in_hours ?? 0,
    priceAmount: raw.price_amount ?? '0',
    priceCurrency: raw.price_currency,
    author: fromAuthorSchema(raw.author),
    webinarDetails: raw.webinar_details
      ? fromWebinarDetails(raw.webinar_details)
      : null,
    publishedAt: raw.published_at,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

function fromAuthorSchema(raw: AuthorSchemaResponse): ProductAuthor {
  return {
    id: raw.oid,
    firstName: raw.first_name,
    lastName: raw.last_name,
    patronymic: raw.patronymic,
  };
}

function fromWebinarDetails(raw: WebinarDetailsSchemaResponse): WebinarDetails {
  return {
    totalLessons: raw.total_lessons,
    defaultDurationMinutes: raw.default_duration_minutes,
    allowRecording: raw.allow_recording,
    defaultMaxParticipants: raw.default_max_participants,
    defaultStreamUrl: raw.default_stream_url,
    accessWindowMinutes: raw.access_window_minutes,
  };
}
