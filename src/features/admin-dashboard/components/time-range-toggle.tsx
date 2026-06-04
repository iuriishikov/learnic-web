'use client';

import { useTranslations } from 'next-intl';

import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group';

import { RANGE_KEYS, type RangeKey } from '../model/range';

const LABEL_KEY: Record<RangeKey, string> = {
  '12m': 'range12m',
  '30d': 'range30d',
  '7d': 'range7d',
  '24h': 'range24h',
};

type TimeRangeToggleProps = {
  /** Active preset, or `null` when the current range is a custom selection. */
  value: RangeKey | null;
  onChange: (range: RangeKey) => void;
};

export function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
  const t = useTranslations('admin-dashboard');

  return (
    <ToggleGroup
      size="sm"
      // Empty array = no preset highlighted (custom date range picked).
      value={value ? [value] : []}
      onValueChange={(group) => {
        // base-ui hands back an array; single-select keeps 0–1 items.
        // Ignore the empty case so a preset click never clears to nothing.
        const next = group[0] as RangeKey | undefined;
        if (next) onChange(next);
      }}
    >
      {RANGE_KEYS.map((key) => (
        <ToggleGroupItem key={key} value={key}>
          {t(LABEL_KEY[key])}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
