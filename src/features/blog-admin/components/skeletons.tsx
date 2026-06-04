import { Skeleton } from '@/shared/ui/skeleton';

/** Loading placeholder for the posts list route. */
export function PostsListSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[960px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-44 md:h-9" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <Skeleton className="h-7 w-56 rounded-lg" />
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="size-8 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loading placeholder for the editor route. */
export function PostEditorSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-40 rounded-md" />
      </div>
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
