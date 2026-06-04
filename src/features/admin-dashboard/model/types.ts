/**
 * Domain types for the admin dashboard's real (backend-backed) data.
 * These are the camelCase shapes the components consume — the snake_case
 * wire payloads are mapped to them at the `api/` boundary.
 */

import type { ChartPoint } from './range';

/** Range-independent platform counters from `GET /admin/stats`. */
export type AdminStats = {
  /** Monthly active users — distinct `site_visit` actors in the last 30 days. */
  mau: number;
  /** Daily active users — distinct `site_visit` actors in the last 24 hours. */
  dau: number;
};

/**
 * Window-scoped metrics derived from `GET /admin/metrics/{metric}?days=N`:
 * the chart series plus the two "new in this period" totals.
 */
export type AdminMetrics = {
  /** One point per day in the window (zero-filled, ascending). */
  points: ChartPoint[];
  /** Products created in the window (sum of the `new_products` series). */
  newProducts: number;
  /** Enrollments in the window (sum of the `enrollments` series). */
  newEnrollments: number;
};

/** One row of `GET /users/top-teachers`, ranked by student count. */
export type TopTeacher = {
  id: string;
  name: string;
  /** Presigned avatar URL, or `null` to fall back to initials. */
  avatarUrl: string | null;
  isVerified: boolean;
  studentCount: number;
  productCount: number;
};
