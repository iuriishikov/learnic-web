'use client';

import { ClockIcon, TrendingUpIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';

import type { Account } from '../model/types';

type AccountSummaryCardProps = {
  account: Account;
  /** 0..1 — proportion of this account vs total available+pending. */
  fillRatio: number;
  className?: string;
};

const RADIUS = 26;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function AccountSummaryCard({
  account,
  fillRatio,
  className,
}: AccountSummaryCardProps) {
  const t = useTranslations('teach-dashboard.wallet.account');
  const format = useFormatter();
  const reduceMotion = useReducedMotion();

  const arc = CIRCUMFERENCE * Math.max(0, Math.min(1, fillRatio));
  const isPositive = account.trendPercent >= 0;

  return (
    <div
      className={cn(
        'flex items-center gap-5 rounded-2xl border border-border bg-card p-5 md:p-6',
        className,
      )}
    >
      <Donut arc={arc} reduceMotion={!!reduceMotion} />

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{t(account.kind)}</p>
        <p className="text-xs text-muted-foreground">
          {account.kind === 'pending'
            ? t('pendingBalance')
            : t('currentBalance')}
        </p>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-[28px]">
            {format.number(account.balance, {
              style: 'currency',
              currency: 'RUB',
              maximumFractionDigits: 2,
            })}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-destructive',
            )}
          >
            <TrendingUpIcon
              className={cn('size-3.5', !isPositive && 'rotate-180')}
            />
            {format.number(account.trendPercent / 100, {
              style: 'percent',
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
        {account.kind === 'pending' && account.holdDays ? (
          <p className="inline-flex items-center gap-1 pt-1 text-[11px] text-muted-foreground">
            <ClockIcon className="size-3" />
            {t('holdNotice', { days: account.holdDays })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Donut({ arc, reduceMotion }: { arc: number; reduceMotion: boolean }) {
  const size = (RADIUS + STROKE) * 2;
  return (
    <div className="relative shrink-0">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--brand-100)"
          strokeWidth={STROKE}
          className="dark:stroke-white/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--brand-600)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: CIRCUMFERENCE - arc }}
          transition={{
            duration: reduceMotion ? 0 : 0.9,
            ease: [0.32, 0.72, 0, 1],
          }}
        />
      </svg>
    </div>
  );
}
