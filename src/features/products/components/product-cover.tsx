'use client';

import { useQuery } from '@tanstack/react-query';
import { ImageOffIcon, RotateCwIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { CoverImage } from '@/shared/ui/cover-image';

import { getProductByIdAction } from '../api/get-product-by-id-action';
import type { Product } from '../model/types';

type ProductCoverProps = {
  productId: string;
  /**
   * When passed, the cover renders immediately from this product without a
   * client-side fetch. Use it when the parent already holds the product (e.g.
   * a server-rendered detail page or a list that's already populated).
   */
  initialProduct?: Product;
  /**
   * Local file preview (e.g. picked from `<input type="file">` before save).
   * Takes precedence over the stored cover and is shown immediately via a
   * managed object URL — no fetch, no upload involved.
   */
  previewFile?: File | Blob | null;
  className?: string;
  /** Overlay content rendered on top of the cover (badges, menus, …). */
  children?: ReactNode;
};

/**
 * Self-fetching product cover. Resolves the product by id (seeded by
 * `initialProduct` when available) and renders the shared {@link CoverImage} —
 * skeleton while loading, the cover (or a live preview) once set, the soft
 * seeded placeholder otherwise. A failed *product* fetch (not a failed image
 * load, which `CoverImage` handles) gets a bespoke, actionable error state.
 */
export function ProductCover({
  productId,
  initialProduct,
  previewFile,
  className,
  children,
}: ProductCoverProps) {
  const t = useTranslations('teach-products.cover');
  const previewUrl = useObjectUrl(previewFile);

  const query = useQuery({
    queryKey: ['product', productId] as const,
    queryFn: async () => {
      const result = await getProductByIdAction(productId);
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    initialData:
      initialProduct && initialProduct.id === productId
        ? initialProduct
        : undefined,
    staleTime: 60_000,
  });

  if (query.isError) {
    const reason = query.error instanceof Error ? query.error.message : '';
    const isNotFound = reason === 'not-found';
    return (
      <div className={cn('relative w-full overflow-hidden', className)}>
        <div
          role="alert"
          className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground"
        >
          <div className="flex max-w-[18rem] flex-col items-center gap-2 px-4 py-3 text-center">
            <div className="flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground/70 shadow-sm ring-1 ring-foreground/10">
              {isNotFound ? (
                <SearchXIcon className="size-4" />
              ) : (
                <ImageOffIcon className="size-4" />
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-semibold leading-tight text-foreground">
                {isNotFound ? t('notFoundTitle') : t('errorTitle')}
              </p>
              <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {isNotFound ? t('notFoundDescription') : t('errorDescription')}
              </p>
            </div>
            {!isNotFound ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => query.refetch()}
                disabled={query.isFetching}
                className="h-7 gap-1.5 px-2.5 text-[11px]"
              >
                <RotateCwIcon
                  className={cn('size-3', query.isFetching && 'animate-spin')}
                />
                {t('retry')}
              </Button>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <CoverImage
      src={previewUrl ?? query.data?.cover?.url}
      alt={t('alt')}
      seed={query.data?.id ?? productId}
      loading={query.isPending}
      sizes="(max-width: 768px) 100vw, 50vw"
      className={className}
    >
      {children}
    </CoverImage>
  );
}
