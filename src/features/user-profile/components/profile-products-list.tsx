'use client';

import { Loader2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  accentFromId,
  ProductCardSkeleton,
  ProductShowcaseCard,
  USER_PRODUCTS_PAGE_SIZE,
  type Product,
} from '@/features/products';
import { useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import { useUserProducts } from '../hooks/use-user-products';

type ProfileProductsListProps = {
  /** Profile owner — drives the per-author products endpoint. */
  userId: string;
  /** First page, fetched on the server; seeds the infinite query. */
  initialProducts: Product[];
};

const GRID_CLASS = 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3';

export function ProfileProductsList({
  userId,
  initialProducts,
}: ProfileProductsListProps) {
  const t = useTranslations('user-profile.products');
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserProducts(userId, USER_PRODUCTS_PAGE_SIZE, initialProducts);

  const products = data?.pages.flat() ?? initialProducts;

  if (products.length === 0) {
    return (
      <p className="rounded-xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground ring-1 ring-border">
        {t('empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ul className={GRID_CLASS}>
        {products.map((product) => (
          <li key={product.id} className="min-w-0">
            <ProductShowcaseCard
              type={product.type}
              typeLabel={t(`type.${product.type}`)}
              title={product.title}
              description={product.description}
              durationLabel={
                product.durationHours > 0
                  ? t('durationHours', { count: product.durationHours })
                  : null
              }
              accent={accentFromId(product.id)}
              coverUrl={product.cover?.url ?? null}
              tags={product.tags}
              onClick={() => router.push(`/products/${product.id}`)}
            />
          </li>
        ))}
        {/* Skeletons appended in the same grid while the next page loads —
            keeps the list height growing smoothly with no centered spinner. */}
        {isFetchingNextPage
          ? Array.from({ length: USER_PRODUCTS_PAGE_SIZE }).map((_, i) => (
              <li key={`pending-${i}`} className="min-w-0">
                <ProductCardSkeleton />
              </li>
            ))
          : null}
      </ul>

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2Icon className="animate-spin" aria-hidden />
            ) : null}
            {t('loadMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
