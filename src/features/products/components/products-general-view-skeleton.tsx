import { Skeleton } from '@/shared/ui/skeleton';

import { ProductCardSkeleton } from './product-card-skeleton';

export function ProductsGeneralViewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48 md:h-9" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </header>

      <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-9 w-72" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-full md:w-64" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-4 md:mt-8 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
