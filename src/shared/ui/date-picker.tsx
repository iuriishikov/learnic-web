'use client';

import * as React from 'react';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { ru as ruLocale } from 'date-fns/locale/ru';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import type { DateRange, Locale as RdpLocale } from 'react-day-picker';
import { CalendarIcon, ClockIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import { Input } from '@/shared/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';

const RANGE_PRESET_IDS = [
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

const CHIP_PRESET_IDS = ['lastWeek', 'lastMonth', 'lastYear'] as const;

type RangePresetId = (typeof RANGE_PRESET_IDS)[number];

// Shared style overrides for the embedded calendar: bigger cells, circular
// selection / today markers, "D" shapes at range endpoints so the muted strip
// bridges through the row to the rectangular middle cells.
const CALENDAR_BASE_CLASS =
  '[--cell-size:--spacing(10)] [--cell-radius:9999px] p-0 [&_button[data-selected-single=true]]:rounded-full';
const CALENDAR_CLASSNAMES = {
  today:
    'rounded-full bg-muted text-foreground data-[selected=true]:bg-transparent',
  range_start:
    'relative rounded-l-full rounded-r-none bg-muted [&:last-child]:rounded-r-full',
  range_middle:
    'rounded-none [&:first-child]:rounded-l-full [&:last-child]:rounded-r-full [&:first-child]:bg-muted [&:last-child]:bg-muted',
  range_end:
    'relative rounded-r-full rounded-l-none bg-muted [&:first-child]:rounded-l-full',
};

function getDateFnsLocale(localeCode: string): RdpLocale {
  return localeCode === 'ru' ? ruLocale : enUS;
}

function getPresetRange(
  preset: RangePresetId,
  now: Date = new Date(),
): DateRange | undefined {
  const weekOptions = { weekStartsOn: 1 as const };
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'thisWeek':
      return {
        from: startOfWeek(now, weekOptions),
        to: endOfWeek(now, weekOptions),
      };
    case 'lastWeek': {
      const lw = subDays(startOfWeek(now, weekOptions), 1);
      return {
        from: startOfWeek(lw, weekOptions),
        to: endOfWeek(lw, weekOptions),
      };
    }
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case 'thisYear':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'lastYear': {
      const ly = subYears(now, 1);
      return { from: startOfYear(ly), to: endOfYear(ly) };
    }
    case 'allTime':
      return undefined;
  }
}

function rangesEqualByDay(a: DateRange | undefined, b: DateRange | undefined) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const fromEq = a.from && b.from ? isSameDay(a.from, b.from) : a.from === b.from;
  const toEq = a.to && b.to ? isSameDay(a.to, b.to) : a.to === b.to;
  return fromEq && toEq;
}

function formatTime24(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function applyTimeString(date: Date, time: string): Date {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return date;
  const next = new Date(date);
  next.setHours(h, m, 0, 0);
  return next;
}

function DateDisplayInput({
  date,
  locale,
  ariaLabel,
  placeholder,
  className,
  formatStr = 'PP',
}: {
  date: Date | undefined;
  locale: RdpLocale;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  formatStr?: string;
}) {
  const value = date ? format(date, formatStr, { locale }) : '';
  return (
    <Input
      type="text"
      readOnly
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn(
        'h-9 cursor-default font-medium text-foreground',
        className,
      )}
    />
  );
}

function FooterStacked({
  onCancel,
  onApply,
  applyDisabled,
}: {
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}) {
  const t = useTranslations('date-picker.buttons');
  return (
    <>
      <Separator />
      <div className="grid grid-cols-2 gap-2 p-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="w-full"
        >
          {t('cancel')}
        </Button>
        <Button
          size="lg"
          onClick={onApply}
          disabled={applyDisabled}
          className="w-full"
        >
          {t('apply')}
        </Button>
      </div>
    </>
  );
}

function InlineFooterActions({
  onCancel,
  onApply,
  applyDisabled,
}: {
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}) {
  const t = useTranslations('date-picker.buttons');
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="lg" onClick={onCancel}>
        {t('cancel')}
      </Button>
      <Button size="lg" onClick={onApply} disabled={applyDisabled}>
        {t('apply')}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DatePicker — single date (ref 3)
// ---------------------------------------------------------------------------

export type DatePickerProps = {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  showTodayButton?: boolean;
};

export function DatePicker({
  value,
  defaultValue,
  onChange,
  placeholder,
  className,
  triggerClassName,
  disabled,
  showTodayButton = true,
}: DatePickerProps) {
  const localeCode = useLocale();
  const tTrigger = useTranslations('date-picker.trigger');
  const tButtons = useTranslations('date-picker.buttons');
  const locale = getDateFnsLocale(localeCode);

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue);
  const current = isControlled ? value : internal;

  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Date | undefined>(current);

  function handleOpenChange(next: boolean) {
    if (next) setPending(current);
    setOpen(next);
  }

  function commit(next: Date | undefined) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={disabled}
            className={cn(
              'w-[220px] justify-start font-normal',
              !current && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <CalendarIcon className="size-4" data-icon="inline-start" />
            {current
              ? format(current, 'PP', { locale })
              : (placeholder ?? tTrigger('pickDate'))}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          'w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0',
          className,
        )}
      >
        <div className="flex flex-col gap-3 p-3">
          <div className="flex items-center gap-2">
            <DateDisplayInput
              date={pending}
              locale={locale}
              ariaLabel={placeholder ?? tTrigger('pickDate')}
              placeholder={placeholder ?? tTrigger('pickDate')}
              className="flex-1"
            />
            {showTodayButton ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPending(startOfDay(new Date()))}
              >
                {tButtons('today')}
              </Button>
            ) : null}
          </div>
          <Calendar
            mode="single"
            locale={locale}
            weekStartsOn={1}
            selected={pending}
            onSelect={(d) => setPending(d ?? undefined)}
            showOutsideDays
            captionLayout="label"
            className={CALENDAR_BASE_CLASS}
            classNames={CALENDAR_CLASSNAMES}
          />
        </div>
        <FooterStacked
          onCancel={() => setOpen(false)}
          onApply={() => commit(pending)}
          applyDisabled={!pending}
        />
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// DateRangePicker — range with optional presets / inline time (refs 4/5/6)
// ---------------------------------------------------------------------------

export type DateRangePickerPresets = 'sidebar' | 'chips' | 'none';

export type DateRangePickerProps = {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  presets?: DateRangePickerPresets;
  numberOfMonths?: number;
  withTime?: boolean;
};

function formatRangeForTrigger(
  range: DateRange | undefined,
  locale: RdpLocale,
  separator: string,
  withTime?: boolean,
) {
  if (!range?.from) return undefined;
  const pattern = withTime ? 'P p' : 'PP';
  const start = format(range.from, pattern, { locale });
  if (!range.to) return start;
  const end = format(range.to, pattern, { locale });
  return `${start} ${separator} ${end}`;
}

function CombinedRangeInput({
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

export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  placeholder,
  className,
  triggerClassName,
  disabled,
  presets = 'none',
  numberOfMonths,
  withTime = false,
}: DateRangePickerProps) {
  const localeCode = useLocale();
  const tTrigger = useTranslations('date-picker.trigger');
  const tLabels = useTranslations('date-picker.labels');
  const locale = getDateFnsLocale(localeCode);

  const months = numberOfMonths ?? (presets === 'sidebar' ? 2 : 1);

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<DateRange | undefined>(
    defaultValue,
  );
  const current = isControlled ? value : internal;

  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<DateRange | undefined>(current);

  function handleOpenChange(next: boolean) {
    if (next) setPending(current);
    setOpen(next);
  }

  function applyPreset(preset: RangePresetId) {
    setPending(getPresetRange(preset));
  }

  function commit(next: DateRange | undefined) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  function setStartTime(time: string) {
    if (!pending?.from) return;
    setPending({ ...pending, from: applyTimeString(pending.from, time) });
  }

  function setEndTime(time: string) {
    if (!pending?.to) return;
    setPending({ ...pending, to: applyTimeString(pending.to, time) });
  }

  const triggerLabel = formatRangeForTrigger(
    current,
    locale,
    tTrigger('rangeSeparator'),
    withTime,
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={disabled}
            className={cn(
              'min-w-[260px] justify-start font-normal',
              !triggerLabel && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <CalendarIcon className="size-4" data-icon="inline-start" />
            {triggerLabel ?? placeholder ?? tTrigger('pickRange')}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          'w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0',
          className,
        )}
      >
        {presets === 'sidebar' ? (
          <div className="flex flex-col md:flex-row">
            <PresetSidebar
              activeRange={pending}
              onPick={applyPreset}
            />
            <div className="flex flex-1 flex-col gap-3 p-3">
              <Calendar
                mode="range"
                locale={locale}
                weekStartsOn={1}
                numberOfMonths={months}
                selected={pending}
                onSelect={(r) => setPending(r ?? undefined)}
                showOutsideDays
                captionLayout="label"
                className={CALENDAR_BASE_CLASS}
                classNames={CALENDAR_CLASSNAMES}
              />
            </div>
          </div>
        ) : presets === 'chips' ? (
          <div className="flex w-[var(--date-picker-chips-width,360px)] flex-col gap-3 p-3">
            <div className="flex w-full items-center gap-2">
              <DateDisplayInput
                date={pending?.from}
                locale={locale}
                ariaLabel={tLabels('startDate')}
                formatStr="P"
                className="flex-1 tabular-nums"
              />
              <span className="text-muted-foreground">–</span>
              <DateDisplayInput
                date={pending?.to}
                locale={locale}
                ariaLabel={tLabels('endDate')}
                formatStr="P"
                className="flex-1 tabular-nums"
              />
            </div>
            <ChipPresets onPick={applyPreset} />
            <div className="flex justify-center">
              <Calendar
                mode="range"
                locale={locale}
                weekStartsOn={1}
                numberOfMonths={months}
                selected={pending}
                onSelect={(r) => setPending(r ?? undefined)}
                showOutsideDays
                captionLayout="label"
                className={CALENDAR_BASE_CLASS}
                classNames={CALENDAR_CLASSNAMES}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3">
            <Calendar
              mode="range"
              locale={locale}
              weekStartsOn={1}
              numberOfMonths={months}
              selected={pending}
              onSelect={(r) => setPending(r ?? undefined)}
              showOutsideDays
              captionLayout="label"
              className={CALENDAR_BASE_CLASS}
              classNames={CALENDAR_CLASSNAMES}
            />
          </div>
        )}

        {presets === 'sidebar' ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              {withTime ? (
                <div className="flex flex-1 items-center gap-2">
                  <CombinedRangeInput
                    date={pending?.from}
                    locale={locale}
                    onTimeChange={setStartTime}
                    ariaLabel={tLabels('startDate')}
                  />
                  <span className="text-muted-foreground">–</span>
                  <CombinedRangeInput
                    date={pending?.to}
                    locale={locale}
                    onTimeChange={setEndTime}
                    ariaLabel={tLabels('endDate')}
                  />
                </div>
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <DateDisplayInput
                    date={pending?.from}
                    locale={locale}
                    ariaLabel={tLabels('startDate')}
                    formatStr="P"
                    className="w-[140px] tabular-nums"
                  />
                  <span className="text-muted-foreground">–</span>
                  <DateDisplayInput
                    date={pending?.to}
                    locale={locale}
                    ariaLabel={tLabels('endDate')}
                    formatStr="P"
                    className="w-[140px] tabular-nums"
                  />
                </div>
              )}
              <InlineFooterActions
                onCancel={() => setOpen(false)}
                onApply={() => commit(pending)}
                applyDisabled={!pending?.from}
              />
            </div>
          </>
        ) : (
          <FooterStacked
            onCancel={() => setOpen(false)}
            onApply={() => commit(pending)}
            applyDisabled={!pending?.from}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function ChipPresets({
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

function PresetSidebar({
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

// ---------------------------------------------------------------------------
// DateTimePicker — single date + time (refs 1/2)
// ---------------------------------------------------------------------------

export type DateTimePickerProps = {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  timeMode?: 'select' | 'slots';
  /**
   * Time labels in 24h "HH:mm" format. Required for `timeMode="slots"`,
   * used as the dropdown options for `timeMode="select"` (auto-generated when omitted).
   */
  timeSlots?: string[];
};

const DEFAULT_TIME_OPTIONS = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 18; h += 1) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

function timeOptionLabel(time: string, locale: RdpLocale) {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const sample = new Date();
  sample.setHours(h, m, 0, 0);
  return format(sample, 'p', { locale });
}

export function DateTimePicker({
  value,
  defaultValue,
  onChange,
  placeholder,
  className,
  triggerClassName,
  disabled,
  timeMode = 'select',
  timeSlots,
}: DateTimePickerProps) {
  const localeCode = useLocale();
  const tTrigger = useTranslations('date-picker.trigger');
  const tButtons = useTranslations('date-picker.buttons');
  const tLabels = useTranslations('date-picker.labels');
  const locale = getDateFnsLocale(localeCode);
  const reduceMotion = useReducedMotion();

  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<Date | undefined>(defaultValue);
  const current = isControlled ? value : internal;

  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Date | undefined>(current);

  function handleOpenChange(next: boolean) {
    if (next) setPending(current);
    setOpen(next);
  }

  function commit(next: Date | undefined) {
    if (!isControlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  function handleSelectDate(d: Date | undefined) {
    if (!d) {
      setPending(undefined);
      return;
    }
    const base = pending ?? d;
    const merged = new Date(d);
    merged.setHours(base.getHours(), base.getMinutes(), 0, 0);
    setPending(merged);
  }

  function handleSetTime(time: string) {
    const base = pending ?? startOfDay(new Date());
    setPending(applyTimeString(base, time));
  }

  function setToday() {
    const today = startOfDay(new Date());
    if (pending) today.setHours(pending.getHours(), pending.getMinutes(), 0, 0);
    setPending(today);
  }

  const options = timeSlots ?? DEFAULT_TIME_OPTIONS;
  const triggerLabel = current
    ? `${format(current, 'PP', { locale })} · ${format(current, 'p', { locale })}`
    : (placeholder ?? tTrigger('pickDateTime'));

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="default"
            disabled={disabled}
            className={cn(
              'min-w-[240px] justify-start font-normal',
              !current && 'text-muted-foreground',
              triggerClassName,
            )}
          >
            <CalendarIcon className="size-4" data-icon="inline-start" />
            {triggerLabel}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          'w-auto max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0',
          className,
        )}
      >
        {timeMode === 'slots' ? (
          <>
            <div className="flex flex-col md:flex-row">
              <div className="flex flex-col gap-3 p-3">
                <Calendar
                  mode="single"
                  locale={locale}
                  weekStartsOn={1}
                  selected={pending}
                  onSelect={handleSelectDate}
                  showOutsideDays
                  captionLayout="label"
                  className={CALENDAR_BASE_CLASS}
                  classNames={CALENDAR_CLASSNAMES}
                />
              </div>
              <Separator
                orientation="vertical"
                className="hidden md:block"
              />
              <div className="flex min-w-[180px] flex-col gap-2 border-t border-border p-3 md:border-t-0">
                <div className="text-sm font-semibold text-foreground">
                  {tLabels('availableTimes')}
                </div>
                <div className="relative">
                  <ScrollArea className="h-[280px]">
                    <div className="flex flex-col gap-2 pr-2">
                      {options.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {tLabels('noTimes')}
                        </p>
                      ) : (
                        options.map((time) => {
                          const isActive =
                            pending && formatTime24(pending) === time;
                          return (
                            <motion.div
                              key={time}
                              whileTap={
                                reduceMotion ? undefined : { scale: 0.97 }
                              }
                              transition={{
                                type: 'spring',
                                stiffness: 500,
                                damping: 30,
                              }}
                            >
                              <Button
                                type="button"
                                variant={isActive ? 'default' : 'outline'}
                                size="lg"
                                onClick={() => handleSetTime(time)}
                                className="w-full justify-center font-medium"
                              >
                                {timeOptionLabel(time, locale)}
                              </Button>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-popover to-transparent" />
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <DateDisplayInput
                  date={pending}
                  locale={locale}
                  ariaLabel={placeholder ?? tTrigger('pickDateTime')}
                  className="w-[160px]"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={setToday}
                >
                  {tButtons('today')}
                </Button>
              </div>
              <InlineFooterActions
                onCancel={() => setOpen(false)}
                onApply={() => commit(pending)}
                applyDisabled={!pending}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 p-3">
              <div className="flex items-center gap-2">
                <DateDisplayInput
                  date={pending}
                  locale={locale}
                  ariaLabel={placeholder ?? tTrigger('pickDateTime')}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="lg"
                  onClick={setToday}
                >
                  {tButtons('today')}
                </Button>
              </div>
              <Select
                value={pending ? formatTime24(pending) : undefined}
                onValueChange={(v) => handleSetTime(v as string)}
              >
                <SelectTrigger className="h-9 w-full">
                  <ClockIcon className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={tLabels('selectTime')} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((time) => (
                    <SelectItem key={time} value={time}>
                      {timeOptionLabel(time, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Calendar
                mode="single"
                locale={locale}
                weekStartsOn={1}
                selected={pending}
                onSelect={handleSelectDate}
                showOutsideDays
                captionLayout="label"
                className={CALENDAR_BASE_CLASS}
                classNames={CALENDAR_CLASSNAMES}
              />
            </div>
            <FooterStacked
              onCancel={() => setOpen(false)}
              onApply={() => commit(pending)}
              applyDisabled={!pending}
            />
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
