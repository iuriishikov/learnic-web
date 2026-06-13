import { Skeleton } from '@/shared/ui/skeleton';

import { ProductCardSkeleton } from './product-card-skeleton';

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
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
