'use client';

import { motion } from 'motion/react';

import { cn } from '@/shared/lib/utils';

export type CircularProgressProps = {
  /** Progress percentage, clamped to 0–100 for the arc. */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  strokeWidth?: number;
  className?: string;
};

/**
 * A circular progress ring with an animated arc and a centered percentage
 * label. Pure visual — feed it a `value` (0–100). The track uses the
 * `muted` token and the arc the `brand` token, so it adapts to the active
 * theme. Built for `PromoCard`'s `visual` slot and similar gauges.
 */
export function CircularProgress({
  value,
  size = 80,
  strokeWidth = 10,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
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
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          className="text-brand"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-foreground tabular-nums">
        {value}%
      </span>
    </div>
  );
}
