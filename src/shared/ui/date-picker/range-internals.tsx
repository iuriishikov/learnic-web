'use client';

import { format } from 'date-fns';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { DateRange, Locale as RdpLocale } from 'react-day-picker';

import { cn } from '@/shared/lib/utils';

import {
  CHIP_PRESET_IDS,
  RANGE_PRESET_IDS,
  type RangePresetId,
} from './constants';
import { formatTime24, getPresetRange, rangesEqualByDay } from './utils';

export function CombinedRangeInput({
  date,
  locale,
  onTimeChange,
  ariaLabel,
  className,
}: {
  date: Date | undefined;
  locale: RdpLocale;
  onTimeChange: (time: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const dateLabel = date ? format(date, 'P', { locale }) : '—';
  const timeLabel = date ? formatTime24(date) : '';
  return (
    <label
      className={cn(
        'group/combined inline-flex h-9 min-w-[220px] items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30',
        className,
      )}
      aria-label={ariaLabel}
    >
      <span className="tabular-nums text-foreground">{dateLabel}</span>
      <span className="text-muted-foreground">–</span>
      <input
        type="time"
        value={timeLabel}
        onChange={(e) => onTimeChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-7 w-[90px] cursor-pointer appearance-none bg-transparent text-sm font-medium tabular-nums text-foreground outline-none [&::-webkit-calendar-picker-indicator]:hidden"
      />
    </label>
  );
}

export function ChipPresets({
  onPick,
}: {
  onPick: (preset: RangePresetId) => void;
}) {
  const tPresets = useTranslations('date-picker.presets');
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      {CHIP_PRESET_IDS.map((preset) => (
        <motion.button
          key={preset}
          type="button"
          onClick={() => onPick(preset)}
          whileTap={reduceMotion ? undefined : { scale: 0.94 }}
          whileHover={reduceMotion ? undefined : { y: -1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
          className="text-sm font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {tPresets(preset)}
        </motion.button>
      ))}
    </div>
  );
}

export function PresetSidebar({
  activeRange,
  onPick,
}: {
  activeRange: DateRange | undefined;
  onPick: (preset: RangePresetId) => void;
}) {
  const tPresets = useTranslations('date-picker.presets');
  const reduceMotion = useReducedMotion();
  const activePreset = RANGE_PRESET_IDS.find((preset) =>
    rangesEqualByDay(activeRange, getPresetRange(preset)),
  );
  return (
    <LayoutGroup id="date-picker-preset-sidebar">
      <div className="flex flex-row gap-1 overflow-x-auto border-b border-border p-2 md:flex-col md:gap-1 md:overflow-x-visible md:border-r md:border-b-0 md:min-w-[180px] md:p-3">
        {RANGE_PRESET_IDS.map((preset) => {
          const isActive = activePreset === preset;
          return (
            <motion.button
              key={preset}
              type="button"
              onClick={() => onPick(preset)}
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className={cn(
                'group/preset relative flex h-9 shrink-0 items-center rounded-lg px-3 text-sm font-normal whitespace-nowrap text-foreground md:w-full md:justify-start',
                'hover:bg-muted/60 transition-colors',
                isActive && 'font-medium',
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="preset-bg-active"
                  className="absolute inset-0 rounded-lg bg-muted"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 400, damping: 32 }
                  }
                />
              ) : null}
              <span className="relative z-10">{tPresets(preset)}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
