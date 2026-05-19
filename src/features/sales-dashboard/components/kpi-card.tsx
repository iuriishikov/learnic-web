'use client';

import {
  MoreHorizontalIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { Line, LineChart } from 'recharts';
import { useNotify } from '@/shared/lib/notify';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ChartContainer, type ChartConfig } from '@/shared/ui/chart';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@/shared/ui/menu';

import type { Kpi } from '../model/types';

const KPI_CONFIG = {
  value: {
    label: 'Value',
    color: 'var(--brand-600)',
  },
} satisfies ChartConfig;

type KpiCardProps = {
  kpi: Kpi;
};

export function KpiCard({ kpi }: KpiCardProps) {
  const t = useTranslations('teach-dashboard.sales.kpi');
  const tMenu = useTranslations('teach-dashboard.sales.kpi.menu');
  const format = useFormatter();
  const notify = useNotify();

  const isPositive = kpi.trendPercent >= 0;
  const sparkData = kpi.spark.map((value, i) => ({ i, value }));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-foreground">{t(`${kpi.id}.label`)}</h3>
        <Menu>
          <MenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('more')}
                className="size-7 -my-1 -mr-1 text-muted-foreground"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            }
          />
          <MenuContent align="end" size="sm" className="w-56">
            <MenuGroup>
              <MenuItem
                onClick={() => notify.success(tMenu('detailsOpened'))}
              >
                {tMenu('details')}
              </MenuItem>
              <MenuItem onClick={() => notify.message(tMenu('comparedToast'))}>
                {tMenu('compare')}
              </MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuGroup>
              <MenuItem onClick={() => notify.success(tMenu('pinnedToast'))}>
                {tMenu('pin')}
              </MenuItem>
            </MenuGroup>
          </MenuContent>
        </Menu>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-heading text-3xl font-semibold tabular-nums tracking-tight text-foreground md:text-[32px]">
          {kpi.format === 'currency'
            ? format.number(kpi.value / 100, {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 2,
              })
            : format.number(kpi.value)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
            isPositive
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-destructive',
          )}
        >
          <TrendingUpIcon
            className={cn('size-3.5', !isPositive && 'rotate-180')}
          />
          {format.number(kpi.trendPercent / 100, {
            style: 'percent',
            maximumFractionDigits: 1,
          })}
        </span>
      </div>

      <div className="-mx-1">
        <ChartContainer
          config={KPI_CONFIG}
          className="aspect-auto h-[88px] w-full"
        >
          <LineChart
            data={sparkData}
            margin={{ top: 6, right: 4, left: 4, bottom: 0 }}
          >
            <Line
              dataKey="value"
              type="monotone"
              stroke="var(--brand-600)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
