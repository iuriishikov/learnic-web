import { Skeleton } from '@/shared/ui/skeleton';

import { AccountSummaryRowSkeleton } from './account-summary-card-skeleton';
import { BalanceChartSkeleton } from './balance-chart-skeleton';
import { RecentDepositsSkeleton } from './recent-deposits-skeleton';
import { YourCardsSkeleton } from './your-cards-skeleton';

export function WalletDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 md:h-8" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex w-full items-center gap-2 md:w-auto">
            <Skeleton className="h-9 flex-1 md:w-28 md:flex-none" />
            <Skeleton className="h-9 flex-1 md:w-32 md:flex-none" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-60" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <AccountSummaryRowSkeleton />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:mt-5 md:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-5">
          <BalanceChartSkeleton />
          <YourCardsSkeleton />
        </div>
        <RecentDepositsSkeleton />
      </div>
    </div>
  );
}
