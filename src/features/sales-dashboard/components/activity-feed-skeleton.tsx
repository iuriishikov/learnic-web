import { Skeleton } from '@/shared/ui/skeleton';

export function ActivityFeedSkeleton() {
  return (
    <aside className="flex flex-col rounded-2xl border border-border bg-card">
      <header className="flex items-center justify-between px-5 py-4 md:px-6">
        <Skeleton className="h-4 w-20" />
      </header>
      <ul className="-mx-1 px-3 pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="flex items-start gap-3 px-2 py-2">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-3 py-2 md:px-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </aside>
  );
}
