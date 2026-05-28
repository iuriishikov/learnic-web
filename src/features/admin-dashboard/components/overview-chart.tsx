'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';

import {
  getChartData,
  getGranularity,
  type DateSpan,
  type Granularity,
  type SeriesVisibility,
} from '../model/mock-data';

type Formatter = ReturnType<typeof useFormatter>;

function formatTick(
  value: number,
  granularity: Granularity,
  format: Formatter,
): string {
  const date = new Date(value);
  if (granularity === 'month') return format.dateTime(date, { month: 'short' });
  if (granularity === 'hour') {
    return format.dateTime(date, { hour: '2-digit', minute: '2-digit' });
  }
  return format.dateTime(date, { day: 'numeric', month: 'short' });
}

type OverviewChartProps = {
  span: DateSpan;
  series: SeriesVisibility;
};

export function OverviewChart({ span, series }: OverviewChartProps) {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();
  const data = getChartData(span);
  const granularity = getGranularity(span);

  const config = {
    users: { label: t('chartUsers'), color: 'var(--brand)' },
    enrollments: { label: t('chartEnrollments'), color: 'var(--chart-3)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-users" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-users)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-users)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fill-enrollments" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-enrollments)"
              stopOpacity={0.12}
            />
            <stop
              offset="100%"
              stopColor="var(--color-enrollments)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical horizontal={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={28}
          tickFormatter={(value: number) =>
            formatTick(value, granularity, format)
          }
        />
        <YAxis hide />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_label, payload) => {
                const point = payload?.[0]?.payload as
                  | { date: number }
                  | undefined;
                return point
                  ? formatTick(point.date, granularity, format)
                  : '';
              }}
            />
          }
        />
        {series.enrollments ? (
          <Area
            dataKey="enrollments"
            type="monotone"
            stroke="var(--color-enrollments)"
            fill="url(#fill-enrollments)"
            strokeWidth={2}
          />
        ) : null}
        {series.users ? (
          <Area
            dataKey="users"
            type="monotone"
            stroke="var(--color-users)"
            fill="url(#fill-users)"
            strokeWidth={2}
          />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}
