'use client';

import { format, startOfDay } from 'date-fns';
import { CalendarIcon, ClockIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Calendar } from '@/shared/ui/calendar';
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

import {
  CALENDAR_BASE_CLASS,
  CALENDAR_CLASSNAMES,
  DEFAULT_TIME_OPTIONS,
} from './constants';
import {
  DateDisplayInput,
  FooterStacked,
  InlineFooterActions,
} from './internal';
import {
  applyTimeString,
  formatTime24,
  getDateFnsLocale,
  timeOptionLabel,
} from './utils';

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
                <Button variant="outline" size="lg" onClick={setToday}>
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
                <Button variant="outline" size="lg" onClick={setToday}>
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
