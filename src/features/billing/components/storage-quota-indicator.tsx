'use client';

import { HardDriveIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { formatBytes } from '@/shared/lib/format-bytes';
import { cn } from '@/shared/lib/utils';

import { type StorageQuota } from '../model/storage-quota';

export type StorageQuotaIndicatorProps = {
  /**
   * Latest quota snapshot from `useStorageQuotaWs`. Purely
   * presentational — the WS hook must live in an always-mounted
   * ancestor (the user-menu root, not the dropdown content, which
   * unmounts on every close and would reopen the socket per open).
   */
  quota: StorageQuota | null;
  className?: string;
};

/**
 * Compact, non-interactive storage-quota meter for the user-menu
 * dropdown. Renders nothing until the first snapshot arrives. The
 * progress bar mirrors `SubscriptionCard`'s thresholds (destructive
 * at >= 90%).
 *
 * Renders its own full-bleed trailing divider so it can sit between two
 * menu groups without orphaning a separator while the quota is null.
 */
export function StorageQuotaIndicator({
  quota,
  className,
}: StorageQuotaIndicatorProps) {
  const t = useTranslations('billing.storage');

  return (
    <AnimatePresence initial={false}>
      {quota ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className={cn('flex flex-col', className)}
        >
          <StorageQuotaMeter
            usedBytes={quota.usedBytes}
            maxBytes={quota.maxBytes}
            remainingBytes={quota.remainingBytes}
            label={t('label')}
            caption={(formatted) => t('caption', formatted)}
          />
          {/* Full-bleed divider — keeps the block self-contained so the
              user-menu doesn't have to gate a sibling MenuSeparator. */}
          <div aria-hidden className="h-px w-full bg-border" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type StorageQuotaMeterProps = {
  usedBytes: number;
  maxBytes: number;
  remainingBytes: number;
  label: string;
  caption: (formatted: {
    used: string;
    max: string;
    remaining: string;
  }) => string;
};

function StorageQuotaMeter({
  usedBytes,
  maxBytes,
  remainingBytes,
  label,
  caption,
}: StorageQuotaMeterProps) {
  // Cap to 100 so the bar can't overflow if a concurrent upload spike
  // outruns the server-side guard — mirrors SubscriptionCard.
  const pct = Math.min(100, Math.round((usedBytes / Math.max(maxBytes, 1)) * 100));

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <HardDriveIcon className="size-3.5" />
        {label}
      </span>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
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
      <p className="text-xs tabular-nums text-muted-foreground">
        {caption({
          used: formatBytes(usedBytes),
          max: formatBytes(maxBytes),
          remaining: formatBytes(remainingBytes),
        })}
      </p>
    </div>
  );
}
