import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Streaming fallback for the "Моё обучение" route — header lines, the
 * underlined tab strip, and a card grid shaped like {@link MyLearningView}
 * so the swap to real content causes no layout shift.
 */
export function MyLearningSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>

      <div className="mt-6 flex items-center gap-7 border-b border-border pb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>

      <ul
        aria-hidden
        className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <CardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-3 w-16" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3.5 w-full" />
        </div>
        <div className="mt-auto flex flex-col gap-2.5 pt-1">
          <Skeleton className="h-5 w-16 rounded-md" />
          <div className="flex items-center gap-2 border-t border-border/60 pt-2.5">
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
