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
  getGranularity,
  type ChartPoint,
  type DateSpan,
  type Granularity,
} from '../model/range';

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
  points: ChartPoint[];
  span: DateSpan;
};

export function OverviewChart({ points, span }: OverviewChartProps) {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();
  const data = points;
  const granularity = getGranularity(span);

  const config = {
    users: { label: t('chartUsers'), color: 'var(--brand)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-users" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-users)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--color-users)" stopOpacity={0} />
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
        <Area
          dataKey="users"
          type="monotone"
          stroke="var(--color-users)"
          fill="url(#fill-users)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
