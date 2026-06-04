/**
 * Date-range + chart-shape helpers for the admin dashboard. Pure UI
 * logic (no data): the time-range toggle, the custom date picker, and
 * the mapping from a selected window to the backend `days` query param.
 *
 * Presets are built relative to a server-provided `nowMs` (passed down
 * from the RSC page) rather than `Date.now()` so the server and client
 * compute the same windows and nothing mismatches on hydration.
 */

import { differenceInCalendarDays, subDays, subMonths } from 'date-fns';

export const RANGE_KEYS = ['12m', '30d', '7d', '24h'] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const DEFAULT_RANGE: RangeKey = '30d';

/** Bounds mirror the backend `METRICS_MIN_DAYS` / `METRICS_MAX_DAYS`. */
export const METRICS_MIN_DAYS = 1;
export const METRICS_MAX_DAYS = 366;

/** A concrete date window the dashboard renders. Both ends are required. */
export type DateSpan = { from: Date; to: Date };

export type ChartPoint = {
  /** Epoch milliseconds for the bucket — formatted to a tick label in the chart. */
  date: number;
  users: number;
};

export type Granularity = 'month' | 'day' | 'hour';

/** Quick-preset windows for the time-range toggle, relative to `nowMs`. */
export function buildRangePresets(nowMs: number): Record<RangeKey, DateSpan> {
  const anchor = new Date(nowMs);
  return {
    '12m': { from: subMonths(anchor, 12), to: anchor },
    '30d': { from: subDays(anchor, 29), to: anchor },
    '7d': { from: subDays(anchor, 6), to: anchor },
    // Backend metric series are daily-only, so "last 24h" resolves to
    // a single UTC day (today). It charts as one point.
    '24h': { from: anchor, to: anchor },
  };
}

/** The preset (if any) a span exactly matches — drives the toggle highlight. */
export function matchPresetKey(
  span: DateSpan,
  presets: Record<RangeKey, DateSpan>,
): RangeKey | null {
  for (const key of RANGE_KEYS) {
    const preset = presets[key];
    if (
      preset.from.getTime() === span.from.getTime() &&
      preset.to.getTime() === span.to.getTime()
    ) {
      return key;
    }
  }
  return null;
}

/** Bucket size derived from the span width — wide spans roll up to months. */
export function getGranularity(span: DateSpan): Granularity {
  const days = differenceInCalendarDays(span.to, span.from);
  if (days > 92) return 'month';
  if (days <= 1) return 'hour';
  return 'day';
}

/**
 * Number of UTC days in the window (inclusive), clamped to the backend
 * accepted range. This is the `days` query param for `/admin/metrics`.
 */
export function spanToDays(span: DateSpan): number {
  const raw = differenceInCalendarDays(span.to, span.from) + 1;
  return Math.min(METRICS_MAX_DAYS, Math.max(METRICS_MIN_DAYS, raw));
}

/**
 * Days each preset resolves to — the value `spanToDays` would produce
 * for `buildRangePresets(now)[key]`, but available without a concrete
 * "now" so the RSC can size the initial fetch purely. `12m` clamps to
 * the backend maximum.
 */
export const RANGE_DAYS: Record<RangeKey, number> = {
  '12m': METRICS_MAX_DAYS,
  '30d': 30,
  '7d': 7,
  '24h': 1,
};

export const DEFAULT_DAYS = RANGE_DAYS[DEFAULT_RANGE];
