'use client';

import { CrownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

import { useMySubscription } from '../api/use-my-subscription';

function _formatBytes(bytes: number, locale = 'ru-RU'): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx += 1;
  }
  return `${value.toLocaleString(locale, {
    maximumFractionDigits: 1,
  })} ${units[unitIdx]}`;
}

export type SubscriptionCardProps = {
  className?: string;
};

export function SubscriptionCard({ className }: SubscriptionCardProps) {
  const t = useTranslations('billing.subscription');
  const { data, isPending } = useMySubscription();

  if (isPending && !data) {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4',
          className,
        )}
      >
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  if (!data) return null;

  const used = data.used.storageBytes;
  const limit = data.plan.limits.storageBytesMax;
  // Cap progress to 100 so the bar doesn't overflow visually if the
  // server-side guard ever lags behind a concurrent upload spike.
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CrownIcon className="size-4 text-brand" />
          <span>{t('label')}</span>
        </div>
        <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
          {data.plan.name}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            {t('storageUsage')}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {_formatBytes(used)} / {_formatBytes(limit)}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div
            className={cn(
              'h-full rounded-full bg-brand transition-[width] duration-300',
              pct >= 90 && 'bg-destructive',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {data.expiresAt ? (
        <p className="text-xs text-muted-foreground">
          {t('expiresAt', {
            date: new Date(data.expiresAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          })}
        </p>
      ) : null}
    </div>
  );
}
