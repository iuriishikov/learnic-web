import { Skeleton } from '@/shared/ui/skeleton';

export function YourCardsSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-6 rounded-md" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[1.586] w-full rounded-2xl" />
            <div className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
