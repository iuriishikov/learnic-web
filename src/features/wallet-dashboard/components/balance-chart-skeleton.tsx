import { Skeleton } from '@/shared/ui/skeleton';

export function BalanceChartSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="mt-4 flex-1">
        <Skeleton className="h-[220px] w-full md:h-[260px]" />
      </div>
    </div>
  );
}
