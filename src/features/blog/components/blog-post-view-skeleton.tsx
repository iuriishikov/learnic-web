import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Loading placeholder for {@link BlogPostView}, shaped to the same
 * centered header + wide square-cornered cover + narrow reading column
 * so data arrival causes no layout shift. Rendered by the route-level
 * `loading.tsx`.
 */
export function BlogPostViewSkeleton() {
  return (
    <div className="w-full pb-16 pt-10 md:pb-24 md:pt-14 lg:pt-16">
      <div className="px-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[45rem] flex-col items-center">
          {/* topic */}
          <Skeleton className="h-4 w-16" />
          {/* title (two centered lines) */}
          <div className="mt-3 flex w-full flex-col items-center gap-3">
            <Skeleton className="h-8 w-4/5 md:h-10 lg:h-12" />
            <Skeleton className="h-8 w-3/5 md:h-10 lg:h-12" />
          </div>
          {/* description */}
          <div className="mt-4 flex w-full flex-col items-center gap-2 md:mt-6">
            <Skeleton className="h-5 w-11/12 md:h-6" />
            <Skeleton className="h-5 w-3/4 md:h-6" />
          </div>
          {/* author byline */}
          <div className="mt-6 flex items-center gap-2.5 md:mt-8">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3.5 w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* cover — wide, square corners */}
      <div className="mt-10 md:mt-16 md:px-6">
        <Skeleton className="mx-auto aspect-[16/9] w-full max-w-5xl rounded-none" />
      </div>

      {/* body */}
      <div className="px-4 md:px-6">
        <div className="mx-auto mt-12 flex w-full max-w-[45rem] flex-col gap-4 md:mt-16 lg:mt-24">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-11/12" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="mt-4 aspect-[16/9] w-full rounded-none" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-10/12" />
        </div>
      </div>
    </div>
  );
}
