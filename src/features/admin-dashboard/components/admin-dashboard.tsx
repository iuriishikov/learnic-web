'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';
import type { DateRange } from 'react-day-picker';

import { DateRangePicker } from '@/shared/ui/date-picker';
import { Separator } from '@/shared/ui/separator';

import {
  DEFAULT_RANGE,
  RANGE_PRESETS,
  matchPresetKey,
  type DateSpan,
  type SeriesVisibility,
} from '../model/mock-data';
import { ChartFilters } from './chart-filters';
import { OverviewPanel } from './overview-panel';
import { QuickActions } from './quick-actions';
import { RecentPosts } from './recent-posts';
import { RecentUsers } from './recent-users';
import { SideStats } from './side-stats';
import { TimeRangeToggle } from './time-range-toggle';

type AdminDashboardProps = {
  userName: string;
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

export function AdminDashboard({ userName }: AdminDashboardProps) {
  const t = useTranslations('admin-dashboard');
  const [span, setSpan] = useState<DateSpan>(RANGE_PRESETS[DEFAULT_RANGE]);
  const [series, setSeries] = useState<SeriesVisibility>({
    users: true,
    enrollments: true,
  });

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
              value={matchPresetKey(span)}
              onChange={(key) => setSpan(RANGE_PRESETS[key])}
            />
            <div className="flex flex-wrap items-center gap-2">
              <DateRangePicker
                value={span}
                onChange={handleRangeChange}
                triggerClassName="h-7"
              />
              <ChartFilters value={series} onChange={setSeries} />
            </div>
          </div>
        </Reveal>

        <Reveal index={1} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <OverviewPanel span={span} series={series} />
          </div>
          <div className="lg:col-span-1">
            <SideStats />
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
            <Reveal index={3}>
              <RecentPosts />
            </Reveal>
          </div>
          <Reveal index={4} className="lg:col-span-1">
            <RecentUsers />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
