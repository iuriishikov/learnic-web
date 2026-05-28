'use client';

import { SlidersHorizontalIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';

import type { SeriesVisibility } from '../model/mock-data';

type ChartFiltersProps = {
  value: SeriesVisibility;
  onChange: (value: SeriesVisibility) => void;
};

const SERIES: readonly (keyof SeriesVisibility)[] = ['users', 'enrollments'];
const LABEL_KEY: Record<keyof SeriesVisibility, string> = {
  users: 'chartUsers',
  enrollments: 'chartEnrollments',
};

export function ChartFilters({ value, onChange }: ChartFiltersProps) {
  const t = useTranslations('admin-dashboard');
  const hiddenCount = SERIES.filter((key) => !value[key]).length;

  function toggle(key: keyof SeriesVisibility, checked: boolean) {
    const next = { ...value, [key]: checked };
    // Keep at least one series on so the chart is never empty.
    if (!next.users && !next.enrollments) return;
    onChange(next);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontalIcon data-icon="inline-start" />
            {t('filters')}
            {hiddenCount > 0 ? (
              <Badge variant="secondary" className="ml-0.5 tabular-nums">
                {hiddenCount}
              </Badge>
            ) : null}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-56">
        <p className="mb-1 px-1 text-xs font-medium text-muted-foreground">
          {t('filtersTitle')}
        </p>
        <div className="flex flex-col">
          {SERIES.map((key) => {
            const id = `chart-series-${key}`;
            return (
              <div
                key={key}
                className="flex items-center gap-2.5 rounded-md px-1 py-2 hover:bg-muted"
              >
                <Checkbox
                  id={id}
                  checked={value[key]}
                  onCheckedChange={(checked) => toggle(key, checked)}
                />
                <label
                  htmlFor={id}
                  className="flex-1 cursor-pointer text-sm text-foreground"
                >
                  {t(LABEL_KEY[key])}
                </label>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
