'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';

import type { BalancePoint } from '../model/types';

const MONTHS_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

type BalanceChartProps = {
  data: BalancePoint[];
};

export function BalanceChart({ data }: BalanceChartProps) {
  const t = useTranslations('teach-dashboard.wallet.balance');
  const tMonths = useTranslations('teach-dashboard.wallet.months');
  const format = useFormatter();

  const chartData = data.map((point) => ({
    month: tMonths(MONTHS_KEYS[point.monthIndex] ?? 'jan'),
    current: point.current,
    previous: point.previous,
  }));

  const config = {
    current: {
      label: t('thisYear'),
      color: 'var(--brand-600)',
    },
    previous: {
      label: t('lastYear'),
      color: 'var(--muted-foreground)',
    },
  } satisfies ChartConfig;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {t('title')}
        </h3>
      </div>

      <div className="mt-4">
        <ChartContainer
          config={config}
          className="aspect-auto h-[220px] w-full md:h-[260px]"
        >
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="2 4" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={0}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{ stroke: 'var(--brand-200)', strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  hideIndicator={false}
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        {config[name as keyof typeof config]?.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {format.number(Number(value), {
                          style: 'currency',
                          currency: 'RUB',
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Line
              dataKey="previous"
              type="monotone"
              stroke="var(--color-previous)"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="current"
              type="monotone"
              stroke="var(--color-current)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
