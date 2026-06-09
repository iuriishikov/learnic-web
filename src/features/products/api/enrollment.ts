import 'server-only';

import { apiFetch } from '@/shared/api/client';

import type {
  Enrollment,
  EnrollmentKind,
  EnrollmentStatus,
  NoteEnrollmentDetails,
} from '../model/enrollment';

export type EnrollIntoProductResult =
  | { ok: true; alreadyEnrolled: boolean }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'not-found'
        | 'private'
        | 'unpublished'
        | 'unreleased'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
    };

// 409 bodies are `SimpleErrorResponseModel` — `{ error: string }`. The
// `error` code maps onto the precise failure the landing surfaces; any
// unknown code (incl. `ProductDoesNotSupport`) collapses to a generic
// conflict. The body may fail to parse (non-JSON / empty) — treat that
// as a generic conflict too.
function map409(code: string | undefined): EnrollIntoProductResult {
  switch (code) {
    case 'AlreadyEnrolled':
      return { ok: true, alreadyEnrolled: true };
    case 'CannotEnrollInPrivateProduct':
      return { ok: false, reason: 'private' };
    case 'CannotEnrollInUnpublishedProduct':
      return { ok: false, reason: 'unpublished' };
    case 'CannotEnrollInUnreleasedNote':
      return { ok: false, reason: 'unreleased' };
    default:
      return { ok: false, reason: 'conflict' };
  }
}

async function safeErrorCode(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body?.error === 'string' ? body.error : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Self-enroll the current user into a product. The backend mints the
 * enrollment (201) or rejects the attempt (409). Auth is required — an
 * anonymous caller gets `unauthorized`.
 */
export async function enrollIntoProduct(
  productId: string,
): Promise<EnrollIntoProductResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/products/${encodeURIComponent(productId)}/enrollments`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 201) return { ok: true, alreadyEnrolled: false };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 422) return { ok: false, reason: 'validation' };
  if (res.status === 409) return map409(await safeErrorCode(res));
  return { ok: false, reason: 'unknown' };
}

type NoteEnrollmentDetailsResponse = {
  release_id: string | null;
  progress_percent: number;
  completed_at: string | null;
};

type EnrollmentSchemaResponse = {
  oid: string;
  kind: EnrollmentKind;
  product_id: string;
  student_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  details: NoteEnrollmentDetailsResponse | null;
};

function fromDetailsResponse(
  raw: NoteEnrollmentDetailsResponse,
): NoteEnrollmentDetails {
  return {
    releaseId: raw.release_id,
    progressPercent: raw.progress_percent,
    completedAt: raw.completed_at,
  };
}

function fromEnrollmentSchema(raw: EnrollmentSchemaResponse): Enrollment {
  return {
    id: raw.oid,
    kind: raw.kind,
    productId: raw.product_id,
    studentId: raw.student_id,
    status: raw.status,
    enrolledAt: raw.enrolled_at,
    details: raw.details !== null ? fromDetailsResponse(raw.details) : null,
  };
}

export type GetMyEnrollmentsResult =
  | { ok: true; enrollments: Enrollment[] }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown' };

/**
 * The current user's enrollments across all products. Auth required —
 * anonymous callers get `unauthorized`.
 */
export async function getMyEnrollments(): Promise<GetMyEnrollmentsResult> {
  let res: Response;
  try {
    res = await apiFetch('/users/me/enrollments', { method: 'GET' });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as EnrollmentSchemaResponse[];
  return { ok: true, enrollments: raw.map(fromEnrollmentSchema) };
}
