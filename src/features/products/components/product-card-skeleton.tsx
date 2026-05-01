import { Skeleton } from '@/shared/ui/skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-auto flex items-center gap-4 pt-3">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>
      <div className="border-t border-border bg-muted/30 px-4 py-2.5">
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}
