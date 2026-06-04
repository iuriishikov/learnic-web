import { setRequestLocale } from 'next-intl/server';

import {
  AdminDashboard,
  DEFAULT_DAYS,
  getAdminMetricsAction,
  getAdminStatsAction,
  getTopTeachersAction,
} from '@/features/admin-dashboard';
import { getCurrentUser } from '@/features/auth/server';
import { httpStatusForReason } from '@/shared/lib/http-error';


type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

const TOP_TEACHERS_LIMIT = 10;

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Guaranteed non-null: the `(app)` layout redirects anonymous users
  // and the `admin` layout 403s non-admins before this renders.
  const user = await getCurrentUser();

  const initialDays = DEFAULT_DAYS;

  const [statsResult, metricsResult, teachersResult] = await Promise.all([
    getAdminStatsAction(),
    getAdminMetricsAction(initialDays),
    getTopTeachersAction(TOP_TEACHERS_LIMIT),
  ]);

  // Stats + metrics are the dashboard's primary resource — a hard load
  // failure (incl. any unavailable metric series) renders the route's
  // error boundary rather than a faked/partial screen. `network`/`unknown`
  // map to 500, `unauthorized` to 401 (via the digest the boundary reads).
  if (!statsResult.ok) {
    throw httpStatusForReason(statsResult.reason, 'Failed to load admin stats');
  }
  if (!metricsResult.ok) {
    throw httpStatusForReason(
      metricsResult.reason,
      'Failed to load admin metrics',
    );
  }
  // Anchor the range presets on the backend's notion of "today" (the last
  // zero-filled point) instead of an impure `Date.now()` — keeps SSR/CSR
  // identical and lines the preset windows up with the chart's right edge.
  // The series is always non-empty (zero-filled); `0` only satisfies types.
  const nowMs = metricsResult.data.points.at(-1)?.date ?? 0;

  // Top teachers is a secondary rail — degrade to an empty list on failure.
  const teachers = teachersResult.ok ? teachersResult.data : [];

  return (
    <AdminDashboard
      userName={user?.firstName ?? ''}
      nowMs={nowMs}
      stats={statsResult.data}
      initialDays={initialDays}
      initialMetrics={metricsResult.data}
      teachers={teachers}
    />
  );
}
