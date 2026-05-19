import { Skeleton } from '@/shared/ui/skeleton';

export function RecentDepositsSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="size-6 rounded-md" />
      </div>
      <ul className="mt-4 -mx-2 flex-1 divide-y divide-border/60">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-2 py-2.5">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
            <Skeleton className="h-3 w-14" />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}
