import { Skeleton } from '@/shared/ui/skeleton';

import { ActivityFeedSkeleton } from './activity-feed-skeleton';
import { KpiRowSkeleton } from './kpi-card-skeleton';
import { OrdersTableSkeleton } from './orders-table-skeleton';
import { SalesChartSkeleton } from './sales-chart-skeleton';

export function SalesDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center md:gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-56 md:h-8" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <Skeleton className="h-9 w-full md:w-64" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-52" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4 md:gap-5">
          <KpiRowSkeleton />
          <SalesChartSkeleton />
          <OrdersTableSkeleton />
        </div>
        <ActivityFeedSkeleton />
      </div>
    </div>
  );
}
