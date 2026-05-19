import { Skeleton } from '@/shared/ui/skeleton';

export function AccountSummaryCardSkeleton() {
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5 md:p-6">
      <Skeleton className="size-16 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-7 w-40 md:h-8" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

export function AccountSummaryRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
      <AccountSummaryCardSkeleton />
      <AccountSummaryCardSkeleton />
    </div>
  );
}
