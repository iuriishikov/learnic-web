'use client';

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  BuildingIcon,
  CreditCardIcon,
  SmartphoneIcon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import * as React from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { MenuGroup, MenuItem, MenuSeparator } from '@/shared/ui/menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/shared/ui/pagination';

import type { Transaction, TxMethod } from '../model/types';

import { KebabMenu } from './kebab-menu';

type RecentDepositsProps = {
  deposits: Transaction[];
};

const PAGE_SIZE = 12;

export function RecentDeposits({ deposits }: RecentDepositsProps) {
  const t = useTranslations('teach-dashboard.wallet.deposits');
  const tPager = useTranslations('teach-dashboard.pagination');
  const format = useFormatter();
  const notify = useNotify();

  const totalPages = Math.max(1, Math.ceil(deposits.length / PAGE_SIZE));
  const [page, setPage] = React.useState(1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = deposits.slice(start, start + PAGE_SIZE);

  return (
    <div className="flex flex-col self-start rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {t('title')}
        </h3>
        <KebabMenu ariaLabel={t('more')}>
          <MenuGroup>
            <MenuItem onClick={() => notify.success(t('menu.exportToast'))}>
              {t('menu.exportCsv')}
            </MenuItem>
            <MenuItem onClick={() => notify.message(t('menu.notImplemented'))}>
              {t('menu.openFilters')}
            </MenuItem>
          </MenuGroup>
          <MenuSeparator />
          <MenuGroup>
            <MenuItem onClick={() => notify.message(t('menu.notImplemented'))}>
              {t('menu.markAll')}
            </MenuItem>
          </MenuGroup>
        </KebabMenu>
      </div>

      <ul className="mt-4 -mx-2 divide-y divide-border/60">
        {visible.map((tx) => {
          const isIn = tx.kind === 'deposit';
          return (
            <li
              key={tx.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
            >
              <TxIcon method={tx.method} isIn={isIn} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {tx.title}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {tx.meta}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
                    isIn
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-destructive',
                  )}
                >
                  {isIn ? (
                    <ArrowDownLeftIcon className="size-3" />
                  ) : (
                    <ArrowUpRightIcon className="size-3" />
                  )}
                  {format.number(tx.amount, {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0,
                    signDisplay: 'always',
                  })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 ? (
        <div className="mt-5 border-t border-border pt-4">
          <Pagination size="sm" align="between">
            <PaginationPrevious
              variant="outline"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              text={tPager('previous')}
            />
            <PaginationContent>
              {Array.from({ length: totalPages }).map((_, i) => {
                const item = i + 1;
                return (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={item === safePage}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
            </PaginationContent>
            <PaginationNext
              variant="outline"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              text={tPager('next')}
            />
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}

function TxIcon({ method, isIn }: { method: TxMethod; isIn: boolean }) {
  const baseClass = cn(
    'inline-flex size-9 shrink-0 items-center justify-center rounded-md ring-1',
    isIn
      ? 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-600 dark:text-emerald-400'
      : 'bg-destructive/10 ring-destructive/20 text-destructive',
  );

  const renderInner = () => {
    switch (method) {
      case 'sbp':
        return <SbpGlyph />;
      case 'card':
        return <CreditCardIcon className="size-4" />;
      case 'stripe':
        return (
          <span className="font-heading text-[10px] font-bold italic">
            stripe
          </span>
        );
      case 'paypal':
        return (
          <span className="font-heading text-[10px] font-bold italic">
            PayPal
          </span>
        );
      case 'applePay':
        return <SmartphoneIcon className="size-4" />;
      case 'yoomoney':
        return <BanknoteIcon className="size-4" />;
      case 'sber-online':
        return <BuildingIcon className="size-4" />;
    }
  };

  return <span className={baseClass}>{renderInner()}</span>;
}

function SbpGlyph() {
  return (
    <span className="font-heading text-[10px] font-extrabold tracking-tight">
      СБП
    </span>
  );
}
