import { Skeleton } from '@/shared/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-md shadow-black/[0.06] ring-1 ring-foreground/10 dark:shadow-black/30">
      <div className="px-[3px] pt-[3px]">
        <Skeleton className="h-40 w-full rounded-t-[9px] rounded-b-none" />
      </div>
      <div className="relative flex flex-1 flex-col gap-3 p-4 pt-0">
        <Skeleton className="-translate-y-1/2 h-6 w-20 rounded-full ring-[3px] ring-card" />
        {/* Title + two-line description excerpt */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        {/* Meta zone: stats row + tag chips above the divider */}
        <div className="mt-auto flex flex-col gap-2.5 border-t border-border/60 pt-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
