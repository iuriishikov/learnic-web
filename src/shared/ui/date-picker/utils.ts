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
import type { DateRange, Locale as RdpLocale } from 'react-day-picker';

import type { RangePresetId } from './constants';

export function getDateFnsLocale(localeCode: string): RdpLocale {
  return localeCode === 'ru' ? ruLocale : enUS;
}

export function getPresetRange(
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

export function rangesEqualByDay(
  a: DateRange | undefined,
  b: DateRange | undefined,
) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const fromEq =
    a.from && b.from ? isSameDay(a.from, b.from) : a.from === b.from;
  const toEq = a.to && b.to ? isSameDay(a.to, b.to) : a.to === b.to;
  return fromEq && toEq;
}

export function formatTime24(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function applyTimeString(date: Date, time: string): Date {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return date;
  const next = new Date(date);
  next.setHours(h, m, 0, 0);
  return next;
}

export function formatRangeForTrigger(
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

export function timeOptionLabel(time: string, locale: RdpLocale) {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const sample = new Date();
  sample.setHours(h, m, 0, 0);
  return format(sample, 'p', { locale });
}
