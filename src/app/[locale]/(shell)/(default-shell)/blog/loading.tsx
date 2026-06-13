import { BlogIndexSkeleton } from '@/features/blog';

export default function BlogIndexLoading() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-[1216px] px-4 py-10 md:px-6 md:py-14 lg:py-16">
        <BlogIndexSkeleton />
      </div>
    </main>
  );
}
