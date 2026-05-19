import { Skeleton } from '@/shared/ui/skeleton';

export function OrdersTableSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-52" />
      </div>
      <div className="px-5 py-4 md:px-6">
        <div className="grid grid-cols-[18px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_18px] gap-3 border-b border-border pb-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[18px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_18px] items-center gap-3 border-b border-border/60 py-3 last:border-b-0"
          >
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3 w-20" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
            <Skeleton className="size-4 rounded" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border px-5 py-3 md:px-6">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
