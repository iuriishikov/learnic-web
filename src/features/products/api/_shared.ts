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
  full_name: string;
  email: string;
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
    fullName: raw.full_name,
    email: raw.email,
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

export type MutationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
    };

export type CreatedResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
    };

export function mapMutationStatus(
  status: number,
): MutationResult | null {
  if (status === 204 || (status >= 200 && status < 300)) return { ok: true };
  if (status === 401) return { ok: false, reason: 'unauthorized' };
  if (status === 403) return { ok: false, reason: 'forbidden' };
  if (status === 404) return { ok: false, reason: 'not-found' };
  if (status === 409) return { ok: false, reason: 'conflict' };
  if (status === 422) return { ok: false, reason: 'validation' };
  return { ok: false, reason: 'unknown' };
}

export async function safeJson(
  res: Response,
): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
