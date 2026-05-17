export const RANGE_PRESET_IDS = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'lastYear',
  'allTime',
] as const;

export const CHIP_PRESET_IDS = ['lastWeek', 'lastMonth', 'lastYear'] as const;

export type RangePresetId = (typeof RANGE_PRESET_IDS)[number];

// Shared style overrides for the embedded calendar: bigger cells, circular
// selection / today markers, "D" shapes at range endpoints so the muted strip
// bridges through the row to the rectangular middle cells.
export const CALENDAR_BASE_CLASS =
  '[--cell-size:--spacing(10)] [--cell-radius:9999px] p-0 [&_button[data-selected-single=true]]:rounded-full';

export const CALENDAR_CLASSNAMES = {
  today:
    'rounded-full bg-muted text-foreground data-[selected=true]:bg-transparent',
  range_start:
    'relative rounded-l-full rounded-r-none bg-muted [&:last-child]:rounded-r-full',
  range_middle:
    'rounded-none [&:first-child]:rounded-l-full [&:last-child]:rounded-r-full [&:first-child]:bg-muted [&:last-child]:bg-muted',
  range_end:
    'relative rounded-r-full rounded-l-none bg-muted [&:first-child]:rounded-l-full',
};

export const DEFAULT_TIME_OPTIONS = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 18; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();
