import { GridBackdrop } from '@/shared/ui/grid-backdrop';
import { Skeleton } from '@/shared/ui/skeleton';

import { ProductCardSkeleton } from './product-card-skeleton';

export function MarketplaceSkeleton() {
  return (
    <div className="flex flex-col">
      <section className="relative isolate w-full overflow-hidden">
        <div className="relative mx-auto w-full max-w-[1216px] px-4 md:px-6">
          <div className="relative pb-12 pt-12 md:pb-16 md:pt-16 lg:pb-20 lg:pt-20">
            <GridBackdrop
              extendToTop={false}
              className="-inset-x-8 -bottom-16 md:-inset-x-16 md:-bottom-20 lg:-inset-x-32 xl:-inset-x-48"
            />

            <div className="relative flex flex-col items-center text-center">
              <Skeleton className="h-10 w-3/4 max-w-2xl md:h-12 lg:h-14" />
              <Skeleton className="mt-4 h-4 w-2/3 max-w-md md:mt-5 md:h-5" />
              <Skeleton className="mt-7 h-12 w-full max-w-xl rounded-xl md:mt-10" />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-12 md:px-8 md:pb-16 lg:px-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Skeleton className="h-3 w-16 rounded-full" />
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_TAGS_PLACEHOLDER_WIDTHS.map((width, i) => (
              <Skeleton
                key={i}
                className="h-8 rounded-full"
                style={{ width: `${width}px` }}
              />
            ))}
          </div>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <ProductCardSkeleton />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const POPULAR_TAGS_PLACEHOLDER_WIDTHS = [
  72, 96, 80, 112, 88, 104, 76, 92, 100, 84, 68, 108,
];
