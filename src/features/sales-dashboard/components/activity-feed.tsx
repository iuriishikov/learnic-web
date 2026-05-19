'use client';

import { useTranslations } from 'next-intl';
import * as React from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import {
  Pagination,
  PaginationNextStep,
  PaginationPrevStep,
} from '@/shared/ui/pagination';
import { UserAvatar } from '@/shared/ui/user-avatar';

import type { ActivityEntry } from '../model/types';

type ActivityFeedProps = {
  entries: ActivityEntry[];
};

const PAGE_SIZE = 12;

export function ActivityFeed({ entries }: ActivityFeedProps) {
  const t = useTranslations('teach-dashboard.sales.activity');
  const tPager = useTranslations('teach-dashboard.pagination');
  const notify = useNotify();

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const [page, setPage] = React.useState(1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = entries.slice(start, start + PAGE_SIZE);

  return (
    <aside className="flex flex-col self-start rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between px-5 py-4 md:px-6">
        <h3 className="font-heading text-sm font-semibold text-foreground">
          {t('title')}
        </h3>
      </header>
      <ul className="-mx-1 px-3 pb-2">
        {visible.map((entry) => (
          <li
            key={entry.id}
            className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
          >
            <div className="relative shrink-0">
              <UserAvatar
                size="sm"
                shape="circle"
                halo={false}
                statusType={null}
                user={{
                  id: entry.customer.id,
                  fullName: entry.customer.name,
                  avatarUrl: entry.customer.avatarUrl,
                }}
              />
              {entry.customer.online ? (
                <span
                  aria-label={t('online')}
                  className={cn(
                    'absolute -right-0.5 top-0 size-2 rounded-full bg-emerald-500 ring-2 ring-card',
                  )}
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 text-xs leading-snug">
              <p className="truncate font-medium text-foreground">
                {entry.customer.name}
              </p>
              <p className="text-muted-foreground">
                {t.rich('purchased', {
                  product: () => (
                    <button
                      type="button"
                      className="font-medium text-brand hover:underline"
                      onClick={() =>
                        notify.message(
                          t('productOpenedToast', {
                            product: entry.productTitle,
                          }),
                        )
                      }
                    >
                      {entry.productTitle}
                    </button>
                  ),
                })}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 ? (
        <div className="border-t border-border px-5 py-3 md:px-6">
          <Pagination size="sm" align="between">
            <PaginationPrevStep
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            />
            <span className="text-xs font-medium tabular-nums text-foreground">
              {tPager('pageOf', { current: safePage, total: totalPages })}
            </span>
            <PaginationNextStep
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </Pagination>
        </div>
      ) : null}
    </aside>
  );
}
