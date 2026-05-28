'use client';

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { useFormatter } from 'next-intl';

import { cn } from '@/shared/lib/utils';

type DeltaBadgeProps = {
  /** Signed percentage delta, e.g. `7.4` or `-2.3`. */
  value: number;
  className?: string;
};

export function DeltaBadge({ value, className }: DeltaBadgeProps) {
  const format = useFormatter();
  const positive = value >= 0;
  const Icon = positive ? ArrowUpIcon : ArrowDownIcon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-border px-1.5 py-0.5 text-xs font-medium tabular-nums',
        positive
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-destructive',
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {format.number(Math.abs(value) / 100, {
        style: 'percent',
        maximumFractionDigits: 1,
      })}
    </span>
  );
}
