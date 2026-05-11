'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { ru as ruLocale } from 'date-fns/locale/ru';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import type { DateRange } from 'react-day-picker';

import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
} from '@/shared/ui/date-picker';

const DEMO_TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
];

type SectionKey =
  | 'rangeWithPresets'
  | 'rangeCompact'
  | 'singleDate'
  | 'singleDatePopover'
  | 'dateWithSlots'
  | 'dateWithTimeSelect';

function DemoSection({
  id,
  index,
  preview,
  result,
}: {
  id: SectionKey;
  index: number;
  preview: React.ReactNode;
  result: React.ReactNode;
}) {
  const t = useTranslations('date-picker-demo.sections');
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <header className="mb-4 flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">
          {t(`${id}.title`)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t(`${id}.description`)}
        </p>
      </header>
      <div className="flex flex-col gap-3">
        <div>{preview}</div>
        <div className="text-xs text-muted-foreground">{result}</div>
      </div>
    </motion.section>
  );
}

function AnimatedValue({
  text,
  fallback,
}: {
  text: string | null;
  fallback: string;
}) {
  const reduceMotion = useReducedMotion();
  const display = text ?? fallback;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={display}
        initial={reduceMotion ? false : { opacity: 0, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: 2 }}
        transition={{ duration: 0.18 }}
        className="inline-block font-medium text-foreground"
      >
        {display}
      </motion.span>
    </AnimatePresence>
  );
}

function formatDate(d: Date | undefined, localeCode: string) {
  if (!d) return null;
  const locale = localeCode === 'ru' ? ruLocale : enUS;
  return format(d, 'PP', { locale });
}

function formatDateTime(d: Date | undefined, localeCode: string) {
  if (!d) return null;
  const locale = localeCode === 'ru' ? ruLocale : enUS;
  return format(d, 'PP · p', { locale });
}

function formatRange(r: DateRange | undefined, localeCode: string) {
  if (!r?.from) return null;
  const locale = localeCode === 'ru' ? ruLocale : enUS;
  const start = format(r.from, 'PP', { locale });
  if (!r.to) return start;
  const end = format(r.to, 'PP', { locale });
  return `${start} — ${end}`;
}

function formatRangeWithTime(r: DateRange | undefined, localeCode: string) {
  if (!r?.from) return null;
  const locale = localeCode === 'ru' ? ruLocale : enUS;
  const start = format(r.from, 'PP · p', { locale });
  if (!r.to) return start;
  const end = format(r.to, 'PP · p', { locale });
  return `${start} — ${end}`;
}

export function DatePickerDemoView() {
  const t = useTranslations('date-picker-demo');
  const localeCode = useLocale();

  const [rangePresets, setRangePresets] = React.useState<
    DateRange | undefined
  >();
  const [rangeChips, setRangeChips] = React.useState<DateRange | undefined>();
  const [singleDate, setSingleDate] = React.useState<Date | undefined>();
  const [singleDatePopover, setSingleDatePopover] = React.useState<
    Date | undefined
  >();
  const [dateWithSlots, setDateWithSlots] = React.useState<Date | undefined>();
  const [dateWithTimeSelect, setDateWithTimeSelect] = React.useState<
    Date | undefined
  >();

  const none = t('none');
  const selected = t('selected');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12 lg:px-8">
      <motion.header
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DemoSection
          id="rangeWithPresets"
          index={0}
          preview={
            <DateRangePicker
              value={rangePresets}
              onChange={setRangePresets}
              presets="sidebar"
              numberOfMonths={2}
              withTime
            />
          }
          result={
            <>
              {selected}{' '}
              <AnimatedValue
                text={formatRangeWithTime(rangePresets, localeCode)}
                fallback={none}
              />
            </>
          }
        />

        <DemoSection
          id="rangeCompact"
          index={1}
          preview={
            <DateRangePicker
              value={rangeChips}
              onChange={setRangeChips}
              presets="chips"
              numberOfMonths={1}
            />
          }
          result={
            <>
              {selected}{' '}
              <AnimatedValue
                text={formatRange(rangeChips, localeCode)}
                fallback={none}
              />
            </>
          }
        />

        <DemoSection
          id="singleDate"
          index={2}
          preview={
            <DatePicker
              value={singleDate}
              onChange={setSingleDate}
              showTodayButton
            />
          }
          result={
            <>
              {selected}{' '}
              <AnimatedValue
                text={formatDate(singleDate, localeCode)}
                fallback={none}
              />
            </>
          }
        />

        <DemoSection
          id="singleDatePopover"
          index={3}
          preview={
            <DatePicker
              value={singleDatePopover}
              onChange={setSingleDatePopover}
              showTodayButton={false}
            />
          }
          result={
            <>
              {selected}{' '}
              <AnimatedValue
                text={formatDate(singleDatePopover, localeCode)}
                fallback={none}
              />
            </>
          }
        />

        <DemoSection
          id="dateWithSlots"
          index={4}
          preview={
            <DateTimePicker
              value={dateWithSlots}
              onChange={setDateWithSlots}
              timeMode="slots"
              timeSlots={DEMO_TIME_SLOTS}
            />
          }
          result={
            <>
              {selected}{' '}
              <AnimatedValue
                text={formatDateTime(dateWithSlots, localeCode)}
                fallback={none}
              />
            </>
          }
        />

        <DemoSection
          id="dateWithTimeSelect"
          index={5}
          preview={
            <DateTimePicker
              value={dateWithTimeSelect}
              onChange={setDateWithTimeSelect}
              timeMode="select"
              timeSlots={DEMO_TIME_SLOTS}
            />
          }
          result={
            <>
              {selected}{' '}
              <AnimatedValue
                text={formatDateTime(dateWithTimeSelect, localeCode)}
                fallback={none}
              />
            </>
          }
        />
      </div>
    </main>
  );
}
