import { Skeleton } from '@/shared/ui/skeleton';

export function ProductEditorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      <Skeleton className="h-32 w-full rounded-2xl md:h-44 lg:h-56" />

      <div className="mt-5 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-8 w-3/4 max-w-md md:h-9" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="mt-5 border-t border-border md:mt-6" />

      <div className="mt-5 grid grid-cols-1 gap-6 md:mt-7 lg:grid-cols-[160px_minmax(0,1fr)_320px] lg:gap-8">
        <aside className="hidden lg:flex lg:flex-col lg:gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </aside>

        <main className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="size-7 shrink-0 rounded-md" />
          </div>

          <div className="mt-5 flex gap-2 lg:hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-20" />
            ))}
          </div>

          <Skeleton className="mt-5 h-20 w-full rounded-xl md:mt-6" />

          <div className="mt-7 flex flex-col gap-2.5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-9/12" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        </main>

        <aside className="flex flex-col gap-5">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </aside>
      </div>
    </div>
  );
}
