'use client';

import { useFormatter, useTranslations } from 'next-intl';

import type { ChartPoint, DateSpan } from '../model/range';
import { OverviewChart } from './overview-chart';

type OverviewPanelProps = {
  /** Headline metric — monthly active users (range-independent). */
  mau: number;
  points: ChartPoint[];
  span: DateSpan;
};

export function OverviewPanel({ mau, points, span }: OverviewPanelProps) {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{t('headline')}</span>
        <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums md:text-4xl">
          {format.number(mau)}
        </span>
      </div>
      <OverviewChart points={points} span={span} />
    </div>
  );
}
