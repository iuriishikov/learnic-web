import { Skeleton } from '@/shared/ui/skeleton';

export function WalletDashboardHeaderSkeleton() {
  return (
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
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
