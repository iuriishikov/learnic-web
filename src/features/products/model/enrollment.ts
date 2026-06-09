/**
 * The learner's enrollment into a product. Created by self-enrollment
 * (`POST /products/{id}/enrollments`) and listed via
 * `GET /users/me/enrollments`. The `kind` discriminator mirrors the
 * backend's polymorphic projection: today only `note` exists, and its
 * `details` carry the pinned release plus progress.
 *
 * Field-name convention: snake_case on the wire (mirrors the backend
 * Pydantic schemas), camelCase in these domain types — mapped at the
 * `api/enrollment.ts` boundary.
 */

import type { Product } from './types';

export type EnrollmentStatus = 'active' | 'revoked';

export type EnrollmentKind = 'note';

export type NoteEnrollmentDetails = {
  releaseId: string | null;
  progressPercent: number;
  completedAt: string | null;
};

export type Enrollment = {
  id: string;
  kind: EnrollmentKind;
  productId: string;
  studentId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  details: NoteEnrollmentDetails | null;
};

/**
 * An enrolled product hydrated with full product details — what the
 * "Моё обучение" grid renders. Assembled server-side by
 * `getEnrolledProducts`: one `GET /products/{id}` per active enrollment
 * returned from `GET /users/me/enrollments`.
 */
export type EnrolledProduct = {
  product: Product;
  /** ISO timestamp the enrollment was created — drives newest-first order. */
  enrolledAt: string;
  /** 0–100. Today always 0 (self-reported progress was removed). */
  progressPercent: number;
};
