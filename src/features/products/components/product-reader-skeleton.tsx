import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

/* Block-row shapes, cycled so a taller media-like row breaks up the stack. */
const LESSON_BLOCK_ROW_CLASSES = [
  'h-24 w-full',
  'h-40 w-full',
  'h-24 w-3/4',
] as const;

/**
 * Placeholder for one lesson's blocks region while the on-demand payload
 * loads. Rendered under the (already painted) lesson header inside the
 * reading column; `rows` mirrors the scheme's `blockCount` (clamped by the
 * caller) so the shape roughly matches the incoming content.
 */
export function LessonBlocksSkeleton({ rows }: { rows: number }) {
  return (
    <div className="mt-8 space-y-8">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'rounded-xl',
            LESSON_BLOCK_ROW_CLASSES[index % LESSON_BLOCK_ROW_CLASSES.length],
          )}
        />
      ))}
    </div>
  );
}

/**
 * Loading placeholder for {@link import('./product-reader-view').ProductReaderView}.
 * Mirrors the reader grid: a desktop sidebar (back row, cover, identity, nav
 * rows), a mobile/tablet control row, and the editorial reading column.
 */
export function ProductReaderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:px-6 md:pt-8 lg:px-8">
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar (desktop only) */}
        <aside className="hidden lg:block">
          <div className="sticky top-[88px] flex flex-col gap-5">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="aspect-video w-full rounded-xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-px w-full" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full rounded-md" />
              ))}
            </div>
          </div>
        </aside>

        {/* Main reading column */}
        <div>
          {/* Mobile/tablet control row */}
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <Skeleton className="h-7 w-32 rounded-md" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="max-w-[820px]">
            <div className="flex flex-col gap-3 border-b border-border pb-5 md:pb-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-2/3" />
            </div>
            <LessonBlocksSkeleton rows={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
