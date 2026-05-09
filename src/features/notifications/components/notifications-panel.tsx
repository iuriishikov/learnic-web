'use client';

import { XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Skeleton } from '@/shared/ui/skeleton';

import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationCountersQuery,
  useNotificationsListQuery,
} from '../api/queries';

import { NotificationItem } from './notification-item';

type Tab = 'all' | 'unread';

const TAB_ORDER: Tab[] = ['all', 'unread'];

type NotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function NotificationsPanel({
  open,
  onClose,
}: NotificationsPanelProps) {
  const t = useTranslations('notifications');
  const [tab, setTab] = useState<Tab>('all');

  const listQuery = useNotificationsListQuery(null, open);
  const countersQuery = useNotificationCountersQuery(open);
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const allItems = useMemo(() => {
    const items = listQuery.data?.pages.flatMap((p) => p.items) ?? [];
    return tab === 'unread' ? items.filter((n) => n.readAt === null) : items;
  }, [listQuery.data, tab]);

  const handleMarkRead = useCallback(
    (id: string) => {
      if (markRead.isPending) return;
      markRead.mutate(id);
    },
    [markRead],
  );

  const tabBadge = (key: Tab): number => {
    const counters = countersQuery.data;
    if (!counters) return 0;
    if (key === 'all') return counters.total;
    return counters.unread;
  };

  const overallUnread = countersQuery.data?.unread ?? 0;
  const isLoading = listQuery.isPending || countersQuery.isPending;

  return (
    <div className="flex h-full max-h-[640px] flex-col">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
          aria-label={t('close')}
        >
          <XIcon className="size-4" />
        </Button>
      </header>

      <nav
        aria-label={t('tabsAriaLabel')}
        className="flex flex-wrap items-center gap-1 px-5 pb-3"
      >
        {TAB_ORDER.map((key) => {
          const active = tab === key;
          const count = tabBadge(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={active}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
                active
                  ? 'border border-border bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span>{t(`tabs.${key}`)}</span>
              {active && count > 0 ? (
                <span
                  className={cn(
                    'inline-flex h-5 min-w-5 items-center justify-center',
                    'rounded-md bg-muted px-1.5 text-xs font-medium text-foreground',
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border" />

      <ScrollArea className="min-h-0 flex-1">
        <div className="py-1">
          {isLoading && allItems.length === 0 ? (
            <NotificationsSkeleton />
          ) : allItems.length === 0 ? (
            <EmptyState message={t('emptyState')} />
          ) : (
            <motion.ul layout className="flex flex-col divide-y divide-border">
              <AnimatePresence initial={false}>
                {allItems.map((notification) => (
                  <NotificationItem
                    key={notification.oid}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                  />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}

          {listQuery.hasNextPage ? (
            <div className="flex justify-center px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => listQuery.fetchNextPage()}
                disabled={listQuery.isFetchingNextPage}
              >
                {listQuery.isFetchingNextPage
                  ? t('loadingMore')
                  : t('loadMore')}
              </Button>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <footer className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-9 px-4"
        >
          {t('close')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={overallUnread === 0 || markAllRead.isPending}
          className="h-9 gap-2 px-4"
        >
          <CheckCheckIconInline />
          {t('markAllRead')}
        </Button>
      </footer>
    </div>
  );
}

function CheckCheckIconInline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  );
}

function NotificationsSkeleton() {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {Array.from({ length: 4 }).map((_, idx) => (
        <li key={idx} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
