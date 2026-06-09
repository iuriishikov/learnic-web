import { Skeleton } from '@/shared/ui/skeleton';

export default function AppLoading() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-8 md:py-16">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-5 w-full max-w-xl" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </section>
  );
}
