import { Suspense } from 'react';

import { AccountSummaryRowSkeleton } from './account-summary-card-skeleton';
import { AccountsBlock } from './accounts-block';
import { BalanceChartBlock } from './balance-chart-block';
import { BalanceChartSkeleton } from './balance-chart-skeleton';
import { RecentDepositsBlock } from './recent-deposits-block';
import { RecentDepositsSkeleton } from './recent-deposits-skeleton';
import { WalletDashboardHeaderBlock } from './wallet-dashboard-header-block';
import { WalletDashboardHeaderSkeleton } from './wallet-dashboard-header-skeleton';
import { YourCardsBlock } from './your-cards-block';
import { YourCardsSkeleton } from './your-cards-skeleton';

export function WalletDashboardView() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <Suspense fallback={<WalletDashboardHeaderSkeleton />}>
        <WalletDashboardHeaderBlock />
      </Suspense>

      <div className="mt-6 md:mt-8">
        <Suspense fallback={<AccountSummaryRowSkeleton />}>
          <AccountsBlock />
        </Suspense>
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 md:mt-5 md:gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4 md:gap-5">
          <Suspense fallback={<BalanceChartSkeleton />}>
            <BalanceChartBlock />
          </Suspense>
          <Suspense fallback={<YourCardsSkeleton />}>
            <YourCardsBlock />
          </Suspense>
        </div>
        <Suspense fallback={<RecentDepositsSkeleton />}>
          <RecentDepositsBlock />
        </Suspense>
      </div>
    </div>
  );
}
