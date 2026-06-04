'use client';

import { useFormatter, useTranslations } from 'next-intl';

type SideStatsProps = {
  /** Daily active users (range-independent). */
  dau: number;
  /** Products created in the selected window. */
  newProducts: number;
  /** Enrollments in the selected window. */
  newEnrollments: number;
};

export function SideStats({ dau, newProducts, newEnrollments }: SideStatsProps) {
  const t = useTranslations('admin-dashboard');
  const format = useFormatter();

  const stats = [
    { key: 'dau', value: dau },
    { key: 'newProducts', value: newProducts },
    { key: 'newEnrollments', value: newEnrollments },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      {stats.map((stat) => (
        <div key={stat.key} className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">
            {t(`stats.${stat.key}`)}
          </span>
          <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {format.number(stat.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
