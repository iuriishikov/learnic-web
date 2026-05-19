'use client';

import {
  MoreVerticalIcon,
  StarIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import * as React from 'react';
import { useNotify } from '@/shared/lib/notify';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from '@/shared/ui/menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { UserAvatar } from '@/shared/ui/user-avatar';

import type { Order, OrdersFilter, OrderStatus } from '../model/types';

type OrdersTableProps = {
  orders: Order[];
};

const FILTERS: OrdersFilter[] = ['all', 'paid', 'refunded'];

export function OrdersTable({ orders }: OrdersTableProps) {
  const t = useTranslations('teach-dashboard.sales.orders');
  const format = useFormatter();
  const notify = useNotify();
  const [filter, setFilter] = React.useState<OrdersFilter>('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const visible = React.useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const allSelected = visible.length > 0 && visible.every((o) => selected.has(o.id));
  const someSelected = !allSelected && visible.some((o) => selected.has(o.id));

  function toggleAll(next: boolean) {
    setSelected((prev) => {
      const updated = new Set(prev);
      visible.forEach((o) => (next ? updated.add(o.id) : updated.delete(o.id)));
      return updated;
    });
  }

  function toggleOne(id: string, next: boolean) {
    setSelected((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(id);
      else updated.delete(id);
      return updated;
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-heading text-2xl font-semibold tabular-nums text-foreground md:text-[28px]">
              {orders.length}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              <TrendingUpIcon className="size-3.5" />
              {format.number(0.086, {
                style: 'percent',
                maximumFractionDigits: 1,
              })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('vsPrevious')}
            </span>
          </div>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as OrdersFilter)}>
          <TabsList size="sm" className="h-8">
            {FILTERS.map((value) => (
              <TabsTrigger key={value} value={value} className="px-3 text-xs">
                {t(`filter.${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label={t('selectAll')}
                />
              </TableHead>
              <TableHead className="text-xs font-medium">{t('column.order')}</TableHead>
              <TableHead className="text-xs font-medium">{t('column.date')}</TableHead>
              <TableHead className="text-xs font-medium">{t('column.status')}</TableHead>
              <TableHead className="text-xs font-medium">{t('column.amount')}</TableHead>
              <TableHead className="text-xs font-medium">{t('column.rating')}</TableHead>
              <TableHead className="text-xs font-medium">{t('column.customer')}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(order.id)}
                    onCheckedChange={(checked) =>
                      toggleOne(order.id, checked === true)
                    }
                    aria-label={t('selectRow', { number: order.number })}
                  />
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {order.number}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format.dateTime(new Date(order.date), {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} label={t(`status.${order.status}`)} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {format.number(order.amount / 100, {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>
                  <RatingStars value={order.rating} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      size="sm"
                      shape="circle"
                      halo={false}
                      statusType={null}
                      user={{
                        id: order.customer.id,
                        fullName: order.customer.name,
                        avatarUrl: order.customer.avatarUrl,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {order.customer.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {order.customer.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Menu>
                    <MenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t('rowMenu')}
                          className="size-7 text-muted-foreground"
                        >
                          <MoreVerticalIcon className="size-4" />
                        </Button>
                      }
                    />
                    <MenuContent align="end" size="sm" className="w-56">
                      <MenuGroup>
                        <MenuItem
                          onClick={() =>
                            notify.success(
                              t('rowActions.openedToast', {
                                number: order.number,
                              }),
                            )
                          }
                        >
                          {t('rowActions.openDetails')}
                        </MenuItem>
                        <MenuItem
                          onClick={() =>
                            notify.message(t('rowActions.contactedToast'))
                          }
                        >
                          {t('rowActions.contactCustomer')}
                        </MenuItem>
                      </MenuGroup>
                      <MenuSeparator />
                      <MenuGroup>
                        <MenuItem
                          variant="destructive"
                          onClick={() =>
                            notify.message(t('rowActions.refundToast'))
                          }
                        >
                          {t('rowActions.refund')}
                        </MenuItem>
                      </MenuGroup>
                    </MenuContent>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrdersPagination />
    </div>
  );
}

function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 px-2 py-0.5 text-[11px] font-medium',
        status === 'paid'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      )}
    >
      <span
        className={cn(
          'inline-block size-1.5 rounded-full',
          status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500',
        )}
      />
      {label}
    </Badge>
  );
}

function RatingStars({ value }: { value: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const star = i + 1;
    if (value >= star) return 'full' as const;
    if (value >= star - 0.5) return 'half' as const;
    return 'empty' as const;
  });
  return (
    <div className="flex items-center gap-0.5" aria-label={`Рейтинг ${value}`}>
      {stars.map((kind, i) => (
        <span key={i} className="relative inline-flex">
          <StarIcon className="size-3.5 text-muted-foreground/40" />
          {kind !== 'empty' ? (
            <span
              aria-hidden
              className="absolute inset-0 overflow-hidden"
              style={{ width: kind === 'full' ? '100%' : '50%' }}
            >
              <StarIcon className="size-3.5 fill-amber-400 text-amber-400" />
            </span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

function OrdersPagination() {
  const t = useTranslations('teach-dashboard.sales.orders.pagination');
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-3 md:flex-row md:items-center md:justify-between md:px-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t('page', { current: 1, total: 4 })}</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">{t('perPage', { count: 10 })}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled>
          {t('previous')}
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
