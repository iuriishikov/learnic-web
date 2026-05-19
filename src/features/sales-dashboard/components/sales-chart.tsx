'use client';

import { TrendingUpIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';

import { cn } from '@/shared/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/shared/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import type { ChartPeriod, SalesPoint } from '../model/types';

const PERIODS: ChartPeriod[] = ['12m', '30d', '7d', '24h'];

type SalesChartProps = {
  total: number;
  trendPercent: number;
  points: SalesPoint[];
};

export function SalesChart({ total, trendPercent, points }: SalesChartProps) {
  const t = useTranslations('teach-dashboard.sales.chart');
  const tPeriod = useTranslations('teach-dashboard.wallet.period');
  const format = useFormatter();
  const [period, setPeriod] = React.useState<ChartPeriod>('30d');

  const isPositive = trendPercent >= 0;

  const config = {
    current: {
      label: t('current'),
      color: 'var(--brand-600)',
    },
    previous: {
      label: t('previous'),
      color: 'var(--muted-foreground)',
    },
  } satisfies ChartConfig;

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as ChartPeriod)}>
          <TabsList size="sm" className="h-8">
            {PERIODS.map((value) => (
              <TabsTrigger key={value} value={value} className="px-3 text-xs">
                {tPeriod(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="px-5 pt-5 md:px-6 md:pt-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-foreground md:text-[36px]">
            {format.number(total, {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium tabular-nums',
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive',
            )}
          >
            <TrendingUpIcon
              className={cn('size-3.5', !isPositive && 'rotate-180')}
            />
            {format.number(trendPercent / 100, {
              style: 'percent',
              maximumFractionDigits: 1,
            })}
          </span>
          <span className="text-muted-foreground">{t('vsPrevious')}</span>
        </div>
      </div>

      <div className="px-2 pt-5 pb-5 md:px-3 md:pb-6">
        <ChartContainer
          config={config}
          className="aspect-auto h-[260px] w-full md:h-[320px]"
        >
          <LineChart
            data={points}
            margin={{ top: 10, right: 12, left: 12, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="2 4" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={1}
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
