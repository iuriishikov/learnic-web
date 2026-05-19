import { Suspense } from 'react';

import { ActivityFeedBlock } from './activity-feed-block';
import { ActivityFeedSkeleton } from './activity-feed-skeleton';
import { KpiCardsBlock } from './kpi-cards-block';
import { KpiRowSkeleton } from './kpi-card-skeleton';
import { OrdersBlock } from './orders-block';
import { OrdersTableSkeleton } from './orders-table-skeleton';
import { SalesChartBlock } from './sales-chart-block';
import { SalesChartSkeleton } from './sales-chart-skeleton';
import { SalesDashboardHeader } from './sales-dashboard-header';

export function SalesDashboardView() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <SalesDashboardHeader />

      <div className="mt-6 grid grid-cols-1 items-start gap-4 md:mt-8 md:gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-5">
          <Suspense fallback={<KpiRowSkeleton />}>
            <KpiCardsBlock />
          </Suspense>
          <Suspense fallback={<SalesChartSkeleton />}>
            <SalesChartBlock />
          </Suspense>
          <Suspense fallback={<OrdersTableSkeleton />}>
            <OrdersBlock />
          </Suspense>
        </div>
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeedBlock />
        </Suspense>
      </div>
    </div>
  );
}
