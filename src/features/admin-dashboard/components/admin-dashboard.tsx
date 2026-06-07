'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, type ReactNode } from 'react';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '@/shared/ui/date-picker';
import { Separator } from '@/shared/ui/separator';

import { useAdminMetrics } from '../api/use-admin-metrics';
import {
  DEFAULT_RANGE,
  buildRangePresets,
  matchPresetKey,
  spanToDays,
  type DateSpan,
} from '../model/range';
import type { AdminMetrics, AdminStats, TopTeacher } from '../model/types';
import { OverviewPanel } from './overview-panel';
import { QuickActions } from './quick-actions';
import { SideStats } from './side-stats';
import { TimeRangeToggle } from './time-range-toggle';
import { TopTeachers } from './top-teachers';

type AdminDashboardProps = {
  userName: string;
  /** Server-resolved "now" so range presets match across SSR/CSR. */
  nowMs: number;
  stats: AdminStats;
  initialDays: number;
  initialMetrics: AdminMetrics;
  teachers: TopTeacher[];
  /**
   * Recent-posts rail, injected by the page so the blog feature stays
   * out of this feature's import graph (no feature → feature coupling).
   */
  recentPosts: ReactNode;
};

const SECTION_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, delay: index * 0.05, ease: 'easeOut' },
  }),
};

function Reveal({
  index,
  className,
  children,
}: {
  index: number;
  className?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={SECTION_VARIANTS}
      custom={index}
      initial={reduce ? false : 'hidden'}
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function AdminDashboard({
  userName,
  nowMs,
  stats,
  initialDays,
  initialMetrics,
  teachers,
  recentPosts,
}: AdminDashboardProps) {
  const t = useTranslations('admin-dashboard');
  const presets = useMemo(() => buildRangePresets(nowMs), [nowMs]);
  const [span, setSpan] = useState<DateSpan>(presets[DEFAULT_RANGE]);

  const days = spanToDays(span);
  const metricsQuery = useAdminMetrics({ days, initialDays, initialMetrics });
  const metrics = metricsQuery.data ?? initialMetrics;

  function handleRangeChange(range: DateRange | undefined) {
    if (range?.from && range.to) setSpan({ from: range.from, to: range.to });
  }

  return (
    <div className="mx-auto w-full max-w-[1216px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-8">
        <Reveal index={0} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t('welcome', { name: userName })}
          </h1>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TimeRangeToggle
              value={matchPresetKey(span, presets)}
              onChange={(key) => setSpan(presets[key])}
            />
            <DateRangePicker
              value={span}
              onChange={handleRangeChange}
              triggerClassName="h-7"
            />
          </div>
          {metricsQuery.isError ? (
            <p className="text-sm text-destructive">{t('metricsError')}</p>
          ) : null}
        </Reveal>

        <Reveal index={1} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OverviewPanel mau={stats.mau} points={metrics.points} span={span} />
          </div>
          <div className="lg:col-span-1">
            <SideStats
              dau={stats.dau}
              newProducts={metrics.newProducts}
              newEnrollments={metrics.newEnrollments}
            />
          </div>
        </Reveal>

        {/* Single full-width rule splitting the analytics block from the
            content block — desktop only, matching the reference. On
            mobile the stacked sections keep their own header rules. */}
        <Separator className="hidden lg:block" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <Reveal index={2}>
              <QuickActions />
            </Reveal>
            <Reveal index={3}>{recentPosts}</Reveal>
          </div>
          <Reveal index={4} className="lg:col-span-1">
            <TopTeachers teachers={teachers} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
