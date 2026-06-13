import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Loading placeholder for {@link LegalDocumentView}, shaped to the same
 * two-column docs layout (sticky TOC sidebar on `lg` + header and reading
 * column) so data arrival causes no layout shift. Rendered by the
 * route-level `loading.tsx`.
 */
export function LegalDocumentViewSkeleton() {
  return (
    <div className="w-full pb-16 pt-10 md:pb-24 md:pt-14 lg:pt-16">
      <div className="mx-auto w-full max-w-[64rem] px-4 md:px-6">
        <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-12">
          {/* Sidebar TOC (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 flex flex-col gap-3 py-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </aside>

          <div className="mx-auto min-w-0 max-w-[45rem] lg:mx-0 lg:max-w-none">
            {/* Header */}
            <div className="border-b border-border pb-6 md:pb-8">
              <Skeleton className="h-8 w-3/4 md:h-9" />
              <Skeleton className="mt-3 h-4 w-40" />
            </div>

            {/* Body */}
            <div className="mt-8 flex flex-col gap-3">
              <Skeleton className="mb-2 h-6 w-2/5" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mb-2 mt-6 h-6 w-1/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-10/12" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
