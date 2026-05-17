import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * Skeleton placeholder for the public user profile route. Mirrors the layout
 * of `UserProfile` + `ProfileHeader` + their child sections (about / experience /
 * products) so first paint doesn't shift when the real data arrives.
 */
export function UserProfileSkeleton() {
  return (
    <article className="flex flex-col bg-background">
      <header className="relative">
        <Skeleton className="h-32 w-full rounded-none sm:h-40 md:h-48 lg:h-56" />

        <div className="px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-6 md:flex-row md:items-end md:gap-6 md:pb-8">
            <Skeleton className="-mt-12 size-24 shrink-0 rounded-full ring-4 ring-background sm:-mt-14 sm:size-28 md:-mt-16 md:size-32" />

            <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="flex min-w-0 flex-col gap-2">
                <Skeleton className="h-6 w-56 sm:h-7" />
                <Skeleton className="h-4 w-40" />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                <Skeleton className="h-10 w-10 rounded-md" />
                <Skeleton className="h-10 w-40 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16 md:gap-10">
          <Separator className="bg-border/70" />

          {/* About me */}
          <section className="grid gap-3 md:grid-cols-[180px_1fr] md:gap-8 lg:grid-cols-[220px_1fr]">
            <Skeleton className="h-4 w-20" />
            <div className="flex min-w-0 flex-col gap-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-10/12" />
                  <Skeleton className="h-4 w-8/12" />
                </div>
                <div className="flex shrink-0 gap-2 md:pt-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="size-9 rounded-md" />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 rounded-xl bg-muted/50 p-4 ring-1 ring-border/70 sm:grid-cols-3 md:p-5 dark:bg-muted/30">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Separator className="bg-border/70" />

          {/* Experience */}
          <section className="grid gap-3 md:grid-cols-[180px_1fr] md:gap-8 lg:grid-cols-[220px_1fr]">
            <Skeleton className="h-4 w-16" />
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-border"
                >
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          </section>

          <Separator className="bg-border/70" />

          {/* Products */}
          <section className="grid gap-3 md:grid-cols-[180px_1fr] md:gap-8 lg:grid-cols-[220px_1fr]">
            <Skeleton className="h-4 w-20" />
            <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="aspect-video w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
