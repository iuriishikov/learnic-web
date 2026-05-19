'use client';

import { useFormatter, useTranslations } from 'next-intl';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { useAuth } from '@/shared/auth';
import { DateRangePicker } from '@/shared/ui/date-picker';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { UserAvatar } from '@/shared/ui/user-avatar';

import type { SalesPeriod } from '../model/types';

const PERIODS: SalesPeriod[] = ['custom', '12m', '30d', '7d', '24h'];

function rangeFromPeriod(period: SalesPeriod, today: Date): DateRange {
  if (period === 'custom') {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { from, to: today };
  }
  const from = new Date(today);
  if (period === '24h') from.setHours(today.getHours() - 24);
  if (period === '7d') from.setDate(today.getDate() - 6);
  if (period === '30d') from.setDate(today.getDate() - 29);
  if (period === '12m') from.setMonth(today.getMonth() - 11);
  return { from, to: today };
}

export function SalesDashboardHeader() {
  const t = useTranslations('teach-dashboard.sales.header');
  const tPeriod = useTranslations('teach-dashboard.wallet.period');
  const tCustom = useTranslations('teach-dashboard.sales.period');
  const format = useFormatter();
  const { user } = useAuth();
  const [period, setPeriod] = React.useState<SalesPeriod>('custom');
  const today = React.useMemo(() => new Date(), []);
  const [range, setRange] = React.useState<DateRange | undefined>(() =>
    rangeFromPeriod('custom', today),
  );

  const greetingName = user?.firstName ?? t('fallbackName');

  function handlePeriodChange(next: SalesPeriod) {
    setPeriod(next);
    setRange(rangeFromPeriod(next, today));
  }

  function handleRangeChange(next: DateRange | undefined) {
    setRange(next);
    setPeriod('custom');
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            size="lg"
            shape="circle"
            halo={false}
            statusType={null}
            user={
              user
                ? {
                    id: user.oid,
                    fullName: user.fullName,
                    avatarUrl: user.avatarUrl,
                  }
                : {
                    id: 'demo',
                    fullName: greetingName,
                    avatarUrl: null,
                  }
            }
          />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
              {t('title', { name: greetingName })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format.dateTime(today, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={period}
          onValueChange={(v) => handlePeriodChange(v as SalesPeriod)}
        >
          <TabsList size="sm" className="h-8">
            {PERIODS.map((value) => (
              <TabsTrigger key={value} value={value} className="px-3 text-xs">
                {value === 'custom' ? tCustom('custom') : tPeriod(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <DateRangePicker
          value={range}
          onChange={handleRangeChange}
          presets="chips"
          triggerClassName="h-8 text-xs"
          numberOfMonths={2}
          placeholder={t('pickRange')}
        />
      </div>

    </div>
  );
}
