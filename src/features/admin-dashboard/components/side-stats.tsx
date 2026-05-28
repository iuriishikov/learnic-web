'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { SIDE_STATS, type SideStat } from '../model/mock-data';
import { DeltaBadge } from './delta-badge';

function formatValue(stat: SideStat, format: ReturnType<typeof useFormatter>) {
  if (stat.kind === 'percent') {
    return format.number(stat.value / 100, {
      style: 'percent',
      maximumFractionDigits: 0,
    });
  }
  return format.number(stat.value);
}

export function SideStats() {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();

  return (
    <div className="flex flex-col gap-6">
      {SIDE_STATS.map((stat) => (
        <div key={stat.key} className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            {t(`stats.${stat.key}`)}
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
              {formatValue(stat, format)}
            </span>
            <DeltaBadge value={stat.deltaPct} />
          </div>
        </div>
      ))}
    </div>
  );
}
