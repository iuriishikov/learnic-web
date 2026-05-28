/**
 * Mock data for the admin dashboard. Everything here is placeholder
 * content — there is no backend behind this screen yet. Values are
 * fully deterministic (a fixed anchor date, no `Math.random` / live
 * `Date.now()`) so server and client render identically and nothing
 * flickers on hydration.
 *
 * Person names, course titles and excerpts are mock *content*, kept as
 * plain strings here; UI chrome (labels, headings, buttons) lives in
 * `next-intl` message catalogs as usual.
 */

import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  subDays,
  subMonths,
} from 'date-fns';

export const RANGE_KEYS = ['12m', '30d', '7d', '24h'] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export const DEFAULT_RANGE: RangeKey = '30d';

/** A concrete date window the dashboard renders. Both ends are required. */
export type DateSpan = { from: Date; to: Date };

/** Which chart series are visible — driven by the Filters popover. */
export type SeriesVisibility = { users: boolean; enrollments: boolean };

export type ChartPoint = {
  /** Epoch milliseconds for the bucket — formatted to a tick label in the chart. */
  date: number;
  users: number;
  enrollments: number;
};

const DAY = 86_400_000;
const HOUR = 3_600_000;
/** Fixed mock "now" — keeps presets and SSR/CSR deterministic. */
const ANCHOR = new Date(Date.UTC(2027, 1, 8)); // 2027-02-08

/** Quick-preset windows for the time-range toggle, relative to the anchor. */
export const RANGE_PRESETS: Record<RangeKey, DateSpan> = {
  '12m': { from: subMonths(ANCHOR, 12), to: ANCHOR },
  '30d': { from: subDays(ANCHOR, 29), to: ANCHOR },
  '7d': { from: subDays(ANCHOR, 6), to: ANCHOR },
  '24h': { from: subDays(ANCHOR, 1), to: ANCHOR },
};

/** The preset (if any) a span exactly matches — drives the toggle highlight. */
export function matchPresetKey(span: DateSpan): RangeKey | null {
  for (const key of RANGE_KEYS) {
    const preset = RANGE_PRESETS[key];
    if (
      preset.from.getTime() === span.from.getTime() &&
      preset.to.getTime() === span.to.getTime()
    ) {
      return key;
    }
  }
  return null;
}

export type Granularity = 'month' | 'day' | 'hour';

/** Bucket size derived from the span width — wide spans roll up to months. */
export function getGranularity(span: DateSpan): Granularity {
  const days = differenceInCalendarDays(span.to, span.from);
  if (days > 92) return 'month';
  if (days <= 1) return 'hour';
  return 'day';
}

function trend(
  base: number,
  growth: number,
  amplitude: number,
  index: number,
  phase: number,
): number {
  return Math.round(
    base + growth * index + amplitude * Math.sin(index * 0.7 + phase),
  );
}

/** Deterministic mock series bucketed to fit the requested span. */
export function getChartData(span: DateSpan): ChartPoint[] {
  const granularity = getGranularity(span);
  const fromMs = span.from.getTime();
  const toMs = span.to.getTime();

  let points: number;
  let start: number;
  let stepMs: number;
  if (granularity === 'hour') {
    points = 24;
    stepMs = HOUR;
    start = toMs - stepMs * (points - 1);
  } else if (granularity === 'month') {
    points = Math.max(2, differenceInCalendarMonths(span.to, span.from) + 1);
    stepMs = (toMs - fromMs) / (points - 1);
    start = fromMs;
  } else {
    points = Math.max(2, differenceInCalendarDays(span.to, span.from) + 1);
    stepMs = DAY;
    start = toMs - stepMs * (points - 1);
  }

  return Array.from({ length: points }, (_, i) => ({
    date: Math.round(start + i * stepMs),
    users: trend(420, 26, 32, i, 0),
    enrollments: trend(240, 18, 22, i, 1.4),
  }));
}

export type HeadlineMetric = { value: number; deltaPct: number };

/** Headline "active users" derived from the series so it tracks the range. */
export function getHeadline(span: DateSpan): HeadlineMetric {
  const data = getChartData(span);
  const first = data[0]?.users ?? 0;
  const last = data.at(-1)?.users ?? 0;
  const deltaPct = first > 0 ? ((last - first) / first) * 100 : 0;
  return { value: last, deltaPct: Math.round(deltaPct * 10) / 10 };
}

export type SideStatKey =
  | 'totalUsers'
  | 'publishedCourses'
  | 'completionRate';

export type SideStat = {
  key: SideStatKey;
  value: number;
  kind: 'count' | 'percent';
  deltaPct: number;
};

export const SIDE_STATS: readonly SideStat[] = [
  { key: 'totalUsers', value: 4862, kind: 'count', deltaPct: 9.2 },
  { key: 'publishedCourses', value: 312, kind: 'count', deltaPct: 6.6 },
  { key: 'completionRate', value: 82, kind: 'percent', deltaPct: 8.1 },
];

export type RecentPost = {
  id: string;
  title: string;
  description: string;
  author: string;
  publishedAt: number;
  category: string;
  /** Deterministic seed for the brand cover placeholder in `BlogPostCard`. */
  imageSeed: string;
};

export const RECENT_POSTS: readonly RecentPost[] = [
  {
    id: 'p1',
    title: 'Создаём REST API на FastAPI',
    description:
      'Рост RESTful API породил волну инструментов для проектирования, ' +
      'тестирования и сопровождения сервисов.',
    author: 'Лана Стайнер',
    publishedAt: Date.UTC(2027, 0, 18),
    category: 'Backend',
    imageSeed: 'fastapi-rest',
  },
  {
    id: 'p2',
    title: 'Совместная работа над дизайном',
    description:
      'Командная работа делает продукт сильнее, а решения каждого ' +
      'дизайнера — точнее и осознаннее.',
    author: 'Натали Крейг',
    publishedAt: Date.UTC(2027, 0, 14),
    category: 'Дизайн',
    imageSeed: 'design-collab',
  },
];

export type RecentUser = {
  id: string;
  name: string;
  joinedAt: number;
  /**
   * Mock avatar image URL, or `null` to fall back to initials. Points at
   * the local gradient placeholders in `public/placeholders/` so the mock
   * works offline (no external avatar service).
   */
  avatarUrl: string | null;
};

const ph = (name: string): string => `/placeholders/${name}.svg`;

export const RECENT_USERS: readonly RecentUser[] = [
  { id: 'u1', name: 'Феникс Бейкер', joinedAt: Date.UTC(2026, 1, 1), avatarUrl: ph('01-aurora') },
  { id: 'u2', name: 'Лана Стайнер', joinedAt: Date.UTC(2026, 0, 12), avatarUrl: ph('02-prism-fade') },
  { id: 'u3', name: 'Деми Уилкинсон', joinedAt: Date.UTC(2026, 2, 3), avatarUrl: ph('03-heatmap') },
  { id: 'u4', name: 'Кэндис Ву', joinedAt: Date.UTC(2026, 1, 21), avatarUrl: null },
  { id: 'u5', name: 'Натали Крейг', joinedAt: Date.UTC(2026, 2, 9), avatarUrl: ph('04-liquid-chrome') },
  { id: 'u6', name: 'Орландо Диггс', joinedAt: Date.UTC(2026, 3, 5), avatarUrl: ph('05-dreamy-blur') },
  { id: 'u7', name: 'Дрю Кано', joinedAt: Date.UTC(2026, 3, 18), avatarUrl: null },
  { id: 'u8', name: 'Кейт Моррисон', joinedAt: Date.UTC(2026, 0, 27), avatarUrl: ph('06-film-grain') },
  { id: 'u9', name: 'Корай Окумус', joinedAt: Date.UTC(2026, 1, 14), avatarUrl: ph('07-dynamic-mesh') },
  { id: 'u10', name: 'Ава Райт', joinedAt: Date.UTC(2026, 2, 2), avatarUrl: null },
];
