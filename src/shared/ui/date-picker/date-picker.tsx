'use client';

import { format, startOfDay } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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

import { CALENDAR_BASE_CLASS, CALENDAR_CLASSNAMES } from './constants';
import { DateDisplayInput, FooterStacked } from './internal';
import { getDateFnsLocale } from './utils';

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
