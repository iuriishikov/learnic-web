import { Skeleton } from '@/shared/ui/skeleton';

const STAT_KEYS = ['users', 'courses', 'completion'] as const;
const CARD_KEYS = ['a', 'b'] as const;
const USER_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

/**
 * Loading placeholder for the admin dashboard. Mirrors
 * `AdminDashboard`'s layout (same container, grid, gaps and block
 * footprints) so the page doesn't shift when the real content
 * streams in. Server-rendered — pure `Skeleton` blocks, no client JS.
 */
export function AdminDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1216px] px-4 py-6 md:px-6 md:py-8">
      <div className="flex flex-col gap-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-56 md:h-9 md:w-72" />
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-7 w-[264px] rounded-lg" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-[230px] rounded-md" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          </div>
        </div>

        {/* Overview: headline + chart (left) / side stats (right) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-40 md:h-10" />
            <Skeleton className="h-[240px] w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-6 lg:col-span-1">
            {STAT_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Single full-width rule (desktop), like the real dashboard */}
        <div className="hidden border-t border-border lg:block" />

        {/* Lower: actions + posts (left) / users (right) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Quick actions */}
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CARD_KEYS.map((key) => (
                  <Skeleton key={key} className="h-[72px] rounded-xl" />
                ))}
              </div>
            </div>

            {/* Recent posts */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-44" />
                <div className="border-t border-border" />
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
                {CARD_KEYS.map((key) => (
                  <div key={key} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3.5 w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent users */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Skeleton className="h-5 w-44" />
            <div className="flex flex-col gap-3">
              {USER_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-3 py-0.5">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
