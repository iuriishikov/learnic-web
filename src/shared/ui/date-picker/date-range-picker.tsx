'use client';

import { CalendarIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import { Separator } from '@/shared/ui/separator';

import {
  CALENDAR_BASE_CLASS,
  CALENDAR_CLASSNAMES,
  type RangePresetId,
} from './constants';
import {
  DateDisplayInput,
  FooterStacked,
  InlineFooterActions,
} from './internal';
import {
  ChipPresets,
  CombinedRangeInput,
  PresetSidebar,
} from './range-internals';
import {
  applyTimeString,
  formatRangeForTrigger,
  getDateFnsLocale,
  getPresetRange,
} from './utils';

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
            <PresetSidebar activeRange={pending} onPick={applyPreset} />
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
