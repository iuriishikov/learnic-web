'use client';

import { useFormatter, useTranslations } from 'next-intl';

import {
  getHeadline,
  type DateSpan,
  type SeriesVisibility,
} from '../model/mock-data';
import { DeltaBadge } from './delta-badge';
import { OverviewChart } from './overview-chart';

type OverviewPanelProps = {
  span: DateSpan;
  series: SeriesVisibility;
};

export function OverviewPanel({ span, series }: OverviewPanelProps) {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();
  const headline = getHeadline(span);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">{t('headline')}</span>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-3xl font-semibold tracking-tight text-foreground tabular-nums md:text-4xl">
            {format.number(headline.value)}
          </span>
          <DeltaBadge value={headline.deltaPct} />
        </div>
      </div>
      <OverviewChart span={span} series={series} />
    </div>
  );
}
