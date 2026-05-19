import type {
  Product,
  ProductAuthor,
  ProductStatus,
  ProductType,
} from '../model/types';

type AuthorSchemaResponse = {
  oid: string;
  full_name: string;
  email: string;
};

export type ProductSchemaResponse = {
  oid: string;
  type: ProductType;
  status: ProductStatus;
  name: string;
  description: string | null;
  total_duration_in_hours: number | null;
  price_amount: number | null;
  author: AuthorSchemaResponse;
  cover_url: string | null;
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
    priceAmount: raw.price_amount,
    author: fromAuthorSchema(raw.author),
    coverUrl: raw.cover_url ?? null,
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
