import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Loading placeholder for {@link BlogPostView}, shaped to the same
 * centered hero + body layout so data arrival causes no layout shift.
 * Rendered by the route-level `loading.tsx`.
 */
export function BlogPostViewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 md:px-6 md:pt-14 lg:pt-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 md:gap-5">
        {/* topic */}
        <Skeleton className="h-4 w-16" />
        {/* title (two centered lines) */}
        <div className="flex w-full flex-col items-center gap-3">
          <Skeleton className="h-9 w-4/5 md:h-11" />
          <Skeleton className="h-9 w-3/5 md:h-11" />
        </div>
        {/* description */}
        <div className="flex w-full flex-col items-center gap-2">
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        {/* author byline */}
        <div className="flex items-center gap-2.5 pt-1">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      </div>

      {/* cover */}
      <Skeleton className="mt-10 aspect-[16/9] w-full rounded-2xl md:mt-12" />

      {/* body */}
      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-4 md:mt-12">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="mt-4 aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-10/12" />
      </div>
    </div>
  );
}
