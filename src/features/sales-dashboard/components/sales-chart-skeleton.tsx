import { Skeleton } from '@/shared/ui/skeleton';

export function SalesChartSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-60" />
      </div>
      <div className="space-y-2 px-5 pt-5 md:px-6 md:pt-6">
        <Skeleton className="h-9 w-52 md:h-10" />
        <Skeleton className="h-4 w-44" />
      </div>
      <div className="px-2 pt-5 pb-5 md:px-3 md:pb-6">
        <Skeleton className="h-[260px] w-full md:h-[320px]" />
      </div>
    </div>
  );
}
