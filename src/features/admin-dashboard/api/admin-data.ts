'use server';

import { apiFetch } from '@/shared/api/client';

import { METRICS_MAX_DAYS, METRICS_MIN_DAYS } from '../model/range';
import type { AdminMetrics, AdminStats, TopTeacher } from '../model/types';

type FailReason = 'unauthorized' | 'network' | 'unknown';
type Result<T> = { ok: true; data: T } | { ok: false; reason: FailReason };

// --- wire shapes (snake_case, mirrored from docs/api/openapi.json) --- //

type AdminStatsWire = { mau: number; dau: number };
type MetricPointWire = { day: string; count: number };
type MetricSeriesWire = { metric: string; points: MetricPointWire[] };
type TopTeacherWire = {
  oid: string;
  full_name: string;
  is_verified: boolean;
  avatar: { url: string } | null;
  student_count: number;
  published_product_count: number;
};

function reasonFor(status: number): FailReason {
  if (status === 401 || status === 403) return 'unauthorized';
  return 'unknown';
}

/** `GET /admin/stats` → range-independent MAU / DAU. */
export async function getAdminStatsAction(): Promise<Result<AdminStats>> {
  try {
    const res = await apiFetch('/admin/stats', { method: 'GET' });
    if (!res.ok) return { ok: false, reason: reasonFor(res.status) };
    const wire = (await res.json()) as AdminStatsWire;
    return { ok: true, data: { mau: wire.mau, dau: wire.dau } };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

function clampDays(days: number): number {
  return Math.min(METRICS_MAX_DAYS, Math.max(METRICS_MIN_DAYS, Math.trunc(days)));
}

async function fetchSeries(
  metric: 'active_users' | 'enrollments' | 'new_products',
  days: number,
): Promise<MetricPointWire[]> {
  const res = await apiFetch(`/admin/metrics/${metric}?days=${days}`, {
    method: 'GET',
  });
  if (!res.ok) {
    const err = new Error(`metric ${metric} failed`) as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  const wire = (await res.json()) as MetricSeriesWire;
  return wire.points;
}

const sum = (points: MetricPointWire[]): number =>
  points.reduce((acc, p) => acc + p.count, 0);

/**
 * `GET /admin/metrics/{active_users,enrollments,new_products}?days=N` —
 * fetched together and folded into the chart series + the two
 * "new in this window" totals. All three series share the same
 * zero-filled day window, so they align by date.
 */
export async function getAdminMetricsAction(
  rawDays: number,
): Promise<Result<AdminMetrics>> {
  const days = clampDays(rawDays);
  try {
    // All three series are required: if any can't be fetched the caller
    // surfaces an error page rather than a half-populated dashboard.
    const [activeUsers, enrollments, newProductsSeries] = await Promise.all([
      fetchSeries('active_users', days),
      fetchSeries('enrollments', days),
      fetchSeries('new_products', days),
    ]);

    // The chart shows only the users series; the enrollments series is
    // still summed below for the "new enrollments" side stat.
    const points = activeUsers.map((p) => ({
      date: Date.parse(p.day),
      users: p.count,
    }));

    return {
      ok: true,
      data: {
        points,
        newProducts: sum(newProductsSeries),
        newEnrollments: sum(enrollments),
      },
    };
  } catch (e) {
    const status = (e as { status?: number }).status;
    if (status === 401 || status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }
    if (status !== undefined) return { ok: false, reason: 'unknown' };
    return { ok: false, reason: 'network' };
  }
}

/** `GET /users/top-teachers?limit=N` → ranked teacher rows. */
export async function getTopTeachersAction(
  limit: number,
): Promise<Result<TopTeacher[]>> {
  try {
    const res = await apiFetch(`/users/top-teachers?limit=${limit}`, {
      method: 'GET',
    });
    if (!res.ok) return { ok: false, reason: reasonFor(res.status) };
    const wire = (await res.json()) as TopTeacherWire[];
    const data = wire.map((t) => ({
      id: t.oid,
      name: t.full_name,
      avatarUrl: t.avatar?.url ?? null,
      isVerified: t.is_verified,
      studentCount: t.student_count,
      productCount: t.published_product_count,
    }));
    return { ok: true, data };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
