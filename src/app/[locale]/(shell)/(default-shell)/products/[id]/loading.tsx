import { ProductReaderSkeleton } from '@/features/products';

export default function ProductReaderLoading() {
  return (
    <main className="flex-1">
      <ProductReaderSkeleton />
    </main>
  );
}
