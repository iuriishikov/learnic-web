import type { Tag } from '@/features/product-tags';
import {
  readResourceLimit,
  type ResourceLimitInfo,
} from '@/shared/api/resource-limit';
import { toApiFile, type FileResponse } from '@/shared/types/user';

import type { LessonBlock } from '../model/draft';
import type {
  Product,
  ProductAuthor,
  ProductStatus,
  ProductType,
  ProductVisibility,
} from '../model/types';

type AuthorSchemaResponse = {
  oid: string;
  full_name: string;
  email: string;
};

type TagSchemaResponse = {
  oid: string;
  name: string;
  color: string;
};

export type ProductSchemaResponse = {
  oid: string;
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  name: string;
  description: string | null;
  total_duration_in_hours: number | null;
  price_amount: number | null;
  author: AuthorSchemaResponse;
  cover: FileResponse | null;
  tags: TagSchemaResponse[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function fromTagSchema(raw: TagSchemaResponse): Tag {
  return { id: raw.oid, name: raw.name, color: raw.color };
}

export function fromProductSchema(raw: ProductSchemaResponse): Product {
  return {
    id: raw.oid,
    type: raw.type,
    status: raw.status,
    visibility: raw.visibility,
    title: raw.name,
    description: raw.description ?? '',
    durationHours: raw.total_duration_in_hours ?? 0,
    priceAmount: raw.price_amount,
    author: fromAuthorSchema(raw.author),
    cover: raw.cover !== null ? toApiFile(raw.cover) : null,
    tags: (raw.tags ?? []).map(fromTagSchema),
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

// Failure reasons used by every mutating server-action wrapper.
// `quota-exceeded` (HTTP 413) and `wrong-content-type` (HTTP 415)
// carry extra metadata so the UI can render an actionable message
// (current usage vs cap; what content type was rejected).
export type QuotaExceededDetails = {
  planCode: string;
  usedBytes: number;
  attemptedBytes: number;
  limitBytes: number;
};

export type WrongContentTypeDetails = {
  fileId: string;
  expectedPrefix: string;
  actual: string;
};

export type MutationFailureReason =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'quota-exceeded'
  | 'wrong-content-type'
  | 'network'
  | 'unknown';

export type MutationResult =
  | { ok: true }
  | {
      ok: false;
      reason: MutationFailureReason;
      message?: string;
      quota?: QuotaExceededDetails;
      wrongContentType?: WrongContentTypeDetails;
      resourceLimit?: ResourceLimitInfo;
    };

export type CreatedResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason: MutationFailureReason;
      message?: string;
      quota?: QuotaExceededDetails;
      wrongContentType?: WrongContentTypeDetails;
      resourceLimit?: ResourceLimitInfo;
    };

// Returned by mutating endpoints that now echo the full `ProductSchema`
// in their 2xx body — cover set/remove, publish, archive, unarchive.
// On success the caller can splice the entity straight into the
// `productKey(id)` cache, skipping a follow-up GET.
export type ProductMutationResult =
  | { ok: true; product: Product }
  | {
      ok: false;
      reason: MutationFailureReason;
      message?: string;
    };

// Returned by mutating endpoints that now echo the full block schema
// (`FileBlockSchema`, `VideoFileBlockSchema`, `PhotoCollageBlockSchema`)
// in their 2xx body — file/video-file/photo-collage add + update.
// On success the caller can merge the entity straight into the
// `noteDraftKey(id)` cache, skipping a follow-up GET.
//
// `block` is optional so legacy 204-only responses (e.g. an older
// backend that hasn't been redeployed with the schema-returning routes)
// still surface as `ok: true` — the caller falls back to invalidating
// `noteDraftKey` instead of breaking the editor with a toast.
export type BlockMutationResult =
  | { ok: true; block?: LessonBlock }
  | {
      ok: false;
      reason: MutationFailureReason;
      message?: string;
      quota?: QuotaExceededDetails;
      wrongContentType?: WrongContentTypeDetails;
      resourceLimit?: ResourceLimitInfo;
    };

function _quotaFromBody(
  body: Record<string, unknown> | null,
): QuotaExceededDetails | undefined {
  if (!body) return undefined;
  const planCode = typeof body.plan_code === 'string' ? body.plan_code : null;
  const used = typeof body.used_bytes === 'number' ? body.used_bytes : null;
  const attempted =
    typeof body.attempted_bytes === 'number' ? body.attempted_bytes : null;
  const limit =
    typeof body.limit_bytes === 'number' ? body.limit_bytes : null;
  if (
    planCode === null ||
    used === null ||
    attempted === null ||
    limit === null
  ) {
    return undefined;
  }
  return {
    planCode,
    usedBytes: used,
    attemptedBytes: attempted,
    limitBytes: limit,
  };
}

function _wrongContentTypeFromBody(
  body: Record<string, unknown> | null,
): WrongContentTypeDetails | undefined {
  if (!body) return undefined;
  const fileId = typeof body.file_id === 'string' ? body.file_id : null;
  const expected =
    typeof body.expected_prefix === 'string' ? body.expected_prefix : null;
  const actual = typeof body.actual === 'string' ? body.actual : null;
  if (fileId === null || expected === null || actual === null) {
    return undefined;
  }
  return { fileId, expectedPrefix: expected, actual };
}

export async function mapErrorResponse(
  res: Response,
): Promise<
  Extract<MutationResult, { ok: false }> | Extract<CreatedResult, { ok: false }>
> {
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return conflictResult(res);
  if (res.status === 413) {
    const body = await safeJson(res);
    return { ok: false, reason: 'quota-exceeded', quota: _quotaFromBody(body) };
  }
  if (res.status === 415) {
    const body = await safeJson(res);
    return {
      ok: false,
      reason: 'wrong-content-type',
      wrongContentType: _wrongContentTypeFromBody(body),
    };
  }
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

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

/**
 * Classify a 409 from a create/mutate endpoint. A backend
 * `ResourceLimitReached` body yields `resourceLimit` so the client can
 * pop the limit dialog; any other 409 stays a plain `conflict` (with the
 * named error in `message`). The body is read via a clone, so the caller
 * may still read `res` afterwards if needed.
 */
export async function conflictResult(res: Response): Promise<{
  ok: false;
  reason: 'conflict';
  message?: string;
  resourceLimit?: ResourceLimitInfo;
}> {
  const resourceLimit = (await readResourceLimit(res)) ?? undefined;
  if (resourceLimit) {
    return { ok: false, reason: 'conflict', resourceLimit };
  }
  const body = await safeJson(res);
  const message = typeof body?.error === 'string' ? body.error : undefined;
  return { ok: false, reason: 'conflict', message };
}
