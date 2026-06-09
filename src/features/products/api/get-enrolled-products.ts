import 'server-only';

import { getMyEnrollments } from './enrollment';
import { getProductById } from './get-product-by-id';
import type { EnrolledProduct } from '../model/enrollment';

export type GetEnrolledProductsResult =
  | { ok: true; items: EnrolledProduct[] }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown' };

/**
 * The current user's enrolled products, hydrated with full product
 * details so the "Моё обучение" grid can render cards directly.
 *
 * The backend exposes no "enrolled products" projection — enrollments
 * (`GET /users/me/enrollments`) carry only the product id. So we list
 * the active ones (revoked enrollments are dropped) and fan out one
 * `GET /products/{id}` per enrollment in parallel; an enrolled student
 * can read a product's details, so these resolve. A product that fails
 * to load individually (deleted, transient 5xx) is dropped from the
 * list rather than failing the whole page — only the enrollment list
 * itself loading is treated as the page's primary signal.
 */
export async function getEnrolledProducts(): Promise<GetEnrolledProductsResult> {
  const enrollments = await getMyEnrollments();
  if (!enrollments.ok) return { ok: false, reason: enrollments.reason };

  // Backend returns enrollments newest-first; keep only live ones.
  const active = enrollments.enrollments.filter((e) => e.status === 'active');

  const hydrated = await Promise.all(
    active.map(async (enrollment) => {
      const result = await getProductById(enrollment.productId);
      if (!result.ok) return null;
      return {
        product: result.product,
        enrolledAt: enrollment.enrolledAt,
        progressPercent: enrollment.details?.progressPercent ?? 0,
      } satisfies EnrolledProduct;
    }),
  );

  return {
    ok: true,
    items: hydrated.filter((item): item is EnrolledProduct => item !== null),
  };
}
