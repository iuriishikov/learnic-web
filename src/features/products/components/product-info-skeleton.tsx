import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Streaming fallback for the public product landing. Mirrors the «Спотлайт»
 * layout (full-bleed cover hero → single editorial column) so data arrival
 * causes no layout shift.
 */
export function ProductInfoSkeleton() {
  return (
    <div className="w-full">
      {/* Full-bleed cover hero with the title block pinned to its bottom. */}
      <div className="relative h-[58svh] max-h-[600px] min-h-[460px] w-full overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <Skeleton className="absolute left-4 top-5 h-9 w-28 md:left-6 md:top-6" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex w-full max-w-[820px] flex-col items-start gap-3.5 px-5 pb-10 md:gap-4 md:px-6 md:pb-14">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4 max-w-xl md:h-11" />
            <Skeleton className="h-5 w-full max-w-md" />
            <div className="mt-1 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Skeleton className="h-12 w-36" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </div>
      </div>

      {/* Editorial column: eyebrow + prose lines per section. */}
      <div className="mx-auto w-full max-w-[820px] px-5 pb-20 md:px-6 md:pb-28">
        <div className="flex flex-col gap-3 pt-10 md:pt-14">
          <Skeleton className="mb-2 h-3.5 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-9/12" />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-10 md:mt-14 md:pt-14">
          <Skeleton className="mb-2 h-3.5 w-24" />
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mt-2 flex items-center gap-4">
              <Skeleton className="h-8 w-10 shrink-0" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
