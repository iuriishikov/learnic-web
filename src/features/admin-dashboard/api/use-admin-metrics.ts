'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import type { AdminMetrics } from '../model/types';

import { getAdminMetricsAction } from './admin-data';

export const adminMetricsKey = (days: number) =>
  ['admin', 'metrics', days] as const;

/**
 * Window-scoped metrics, refetched when the selected range (`days`)
 * changes. Seeded with the SSR-resolved page so the first paint needs
 * no client request; `keepPreviousData` holds the current chart while
 * a new range loads (no blank flash on toggle).
 */
export function useAdminMetrics(args: {
  days: number;
  initialDays: number;
  initialMetrics: AdminMetrics;
}) {
  const { days, initialDays, initialMetrics } = args;
  return useQuery<AdminMetrics, Error>({
    queryKey: adminMetricsKey(days),
    queryFn: async () => {
      const result = await getAdminMetricsAction(days);
      if (!result.ok) throw new Error(result.reason);
      return result.data;
    },
    initialData: days === initialDays ? initialMetrics : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
