import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Loading placeholder shaped to {@link BlogPostCard}: a 16/9 cover, a
 * title line, two body lines, and the read-CTA line. Shared by every
 * surface that renders blog cards (home grid, admin dashboard rail) so
 * the loading state is identical everywhere.
 */
export function BlogPostCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <Skeleton className="aspect-[16/9] w-full rounded-sm" />
      <div className="flex flex-1 flex-col pt-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-2.5 h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
        <div className="mt-auto pt-4">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}
