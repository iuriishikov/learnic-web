import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Streaming fallback for the public product landing. Mirrors the real layout
 * (back row → hero → 2-column body) so data arrival causes no layout shift.
 */
export function ProductInfoSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="mb-5 h-8 w-32" />

      <Skeleton className="aspect-[16/10] w-full rounded-2xl sm:aspect-[16/9] md:aspect-[2.6/1]" />

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton className="h-9 w-3/4 max-w-xl" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1 h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-9/12" />
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-border p-5">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mt-1 h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
