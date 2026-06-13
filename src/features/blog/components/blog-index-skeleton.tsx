import { cn } from '@/shared/lib/utils';
import { BlogPostCardSkeleton } from '@/shared/ui/blog-post-card-skeleton';
import { Skeleton } from '@/shared/ui/skeleton';

const GRID_CLASS =
  'grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-16';

/**
 * Loading placeholder for {@link BlogIndex}, shaped to the same masthead +
 * two-column featured hero + post grid so data arrival causes no layout
 * shift. Rendered by the route-level `loading.tsx`.
 */
export function BlogIndexSkeleton() {
  return (
    <>
      {/* Masthead */}
      <div className="flex max-w-[760px] flex-col gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-4/5 md:h-10 lg:h-11" />
        <Skeleton className="h-5 w-full max-w-[640px]" />
      </div>

      {/* Featured hero */}
      <div className="mt-10 grid grid-cols-1 gap-6 md:mt-14 lg:mt-16 lg:grid-cols-2 lg:items-center lg:gap-10">
        <Skeleton className="aspect-[16/10] w-full rounded-sm" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3.5 w-24" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-11/12 md:h-9 lg:h-10" />
            <Skeleton className="h-8 w-3/5 md:h-9 lg:h-10" />
          </div>
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <div className="mt-1 flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Post grid */}
      <div className="mt-16 md:mt-20 lg:mt-24">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-px w-full" />
        <div className={cn(GRID_CLASS, 'mt-8 md:mt-10')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogPostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </>
  );
}
