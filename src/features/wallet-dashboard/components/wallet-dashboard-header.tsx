'use client';

import {
  ArrowDownToLineIcon,
  ArrowUpRightIcon,
  ListFilterIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';
import { DateRangePicker } from '@/shared/ui/date-picker';
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from '@/shared/ui/menu';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import type { Period, WalletCard } from '../model/types';

import { WithdrawalDialog } from './withdrawal-dialog';

const PERIODS: Period[] = ['12m', '30d', '7d', '24h'];

type TxTypeFilter = 'deposit' | 'withdrawal';
type AmountFilter = 'small' | 'medium' | 'large';

type WalletDashboardHeaderProps = {
  availableBalance: number;
  cards: WalletCard[];
};

function rangeFromPeriod(period: Period, today: Date): DateRange {
  const from = new Date(today);
  if (period === '24h') from.setHours(today.getHours() - 24);
  if (period === '7d') from.setDate(today.getDate() - 6);
  if (period === '30d') from.setDate(today.getDate() - 29);
  if (period === '12m') from.setMonth(today.getMonth() - 11);
  return { from, to: today };
}

export function WalletDashboardHeader({
  availableBalance,
  cards,
}: WalletDashboardHeaderProps) {
  const t = useTranslations('teach-dashboard.wallet.header');
  const tPeriod = useTranslations('teach-dashboard.wallet.period');
  const tFilters = useTranslations('teach-dashboard.wallet.filters');
  const notify = useNotify();

  const [period, setPeriod] = React.useState<Period>('12m');
  const today = React.useMemo(() => new Date(), []);
  const [range, setRange] = React.useState<DateRange | undefined>(() =>
    rangeFromPeriod('12m', today),
  );

  const [txTypes, setTxTypes] = React.useState<Set<TxTypeFilter>>(
    () => new Set<TxTypeFilter>(['deposit', 'withdrawal']),
  );
  const [amount, setAmount] = React.useState<Set<AmountFilter>>(
    () => new Set<AmountFilter>(['small', 'medium', 'large']),
  );
  const [bankOnly, setBankOnly] = React.useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = React.useState(false);

  const activeFilterCount =
    (3 - txTypes.size) + (3 - amount.size) + (bankOnly ? 1 : 0);

  function handlePeriodChange(next: Period) {
    setPeriod(next);
    setRange(rangeFromPeriod(next, today));
  }

  function toggleTx(type: TxTypeFilter) {
    setTxTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function toggleAmount(level: AmountFilter) {
    setAmount((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  function resetFilters() {
    setTxTypes(new Set<TxTypeFilter>(['deposit', 'withdrawal']));
    setAmount(new Set<AmountFilter>(['small', 'medium', 'large']));
    setBankOnly(false);
    notify.success(tFilters('resetToast'));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-6">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-[28px]">
            {t('title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex w-full items-center gap-2 md:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 flex-1 gap-1.5 md:flex-none"
            onClick={() => notify.message(t('depositToast'))}
          >
            <ArrowDownToLineIcon className="size-4" />
            {t('deposit')}
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-9 flex-1 gap-1.5 md:flex-none"
            onClick={() => setWithdrawalOpen(true)}
          >
            <ArrowUpRightIcon className="size-4" />
            {t('sendFunds')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={period}
          onValueChange={(v) => handlePeriodChange(v as Period)}
        >
          <TabsList size="sm" className="h-8">
            {PERIODS.map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="px-3 text-xs font-medium"
              >
                {tPeriod(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={range}
            onChange={(next) => {
              setRange(next);
            }}
            presets="sidebar"
            triggerClassName="h-8 text-xs"
            numberOfMonths={1}
            placeholder={t('selectDates')}
          />
          <Menu>
            <MenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                >
                  <ListFilterIcon className="size-3.5" />
                  {t('filters')}
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/10 px-1 text-[10px] font-semibold leading-none">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </Button>
              }
            />
            <MenuContent align="end" size="md" className="w-64">
              <MenuGroup>
                <MenuLabel>{tFilters('typeLabel')}</MenuLabel>
                <MenuCheckboxItem
                  checked={txTypes.has('deposit')}
                  onCheckedChange={() => toggleTx('deposit')}
                  closeOnClick={false}
                >
                  {tFilters('typeDeposit')}
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={txTypes.has('withdrawal')}
                  onCheckedChange={() => toggleTx('withdrawal')}
                  closeOnClick={false}
                >
                  {tFilters('typeWithdrawal')}
                </MenuCheckboxItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuLabel>{tFilters('amountLabel')}</MenuLabel>
                <MenuCheckboxItem
                  checked={amount.has('small')}
                  onCheckedChange={() => toggleAmount('small')}
                  closeOnClick={false}
                >
                  {tFilters('amountSmall')}
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={amount.has('medium')}
                  onCheckedChange={() => toggleAmount('medium')}
                  closeOnClick={false}
                >
                  {tFilters('amountMedium')}
                </MenuCheckboxItem>
                <MenuCheckboxItem
                  checked={amount.has('large')}
                  onCheckedChange={() => toggleAmount('large')}
                  closeOnClick={false}
                >
                  {tFilters('amountLarge')}
                </MenuCheckboxItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuCheckboxItem
                  checked={bankOnly}
                  onCheckedChange={(checked) => setBankOnly(checked === true)}
                  closeOnClick={false}
                >
                  {tFilters('bankOnly')}
                </MenuCheckboxItem>
              </MenuGroup>
              <MenuSeparator />
              <MenuGroup>
                <MenuItem onClick={resetFilters}>{tFilters('reset')}</MenuItem>
              </MenuGroup>
            </MenuContent>
          </Menu>
        </div>
      </div>

      <WithdrawalDialog
        open={withdrawalOpen}
        onOpenChange={setWithdrawalOpen}
        availableBalance={availableBalance}
        cards={cards}
      />
    </div>
  );
}
