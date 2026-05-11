'use client';

import { useQuery } from '@tanstack/react-query';
import { ImageOffIcon, RotateCwIcon, SearchXIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { HTMLAttributes, ReactNode } from 'react';

import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Placeholder } from '@/shared/ui/placeholder';
import { Skeleton } from '@/shared/ui/skeleton';

import { getProductByIdAction } from '../api/get-product-by-id-action';
import type { Product } from '../model/types';

type ProductCoverProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  productId: string;
  /**
   * When passed, the cover renders immediately from this product without a
   * client-side fetch. Use it when the parent already holds the product (e.g.
   * a server-rendered detail page or a list that's already populated).
   */
  initialProduct?: Product;
  /**
   * Local file preview (e.g. picked from `<input type="file">` before save).
   * Takes precedence over the gradient and is shown immediately via a managed
   * object URL — no fetch, no upload involved.
   */
  previewFile?: File | Blob | null;
  /** Overlay content rendered on top of the gradient (badges, menus, …). */
  children?: ReactNode;
};

const FADE = { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const };

export function ProductCover({
  productId,
  initialProduct,
  previewFile,
  className,
  children,
  ...rest
}: ProductCoverProps) {
  const t = useTranslations('teach-products.cover');
  const reduceMotion = useReducedMotion();
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

  let body: ReactNode;
  if (previewUrl) {
    body = (
      <motion.div
        key="preview"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${previewUrl})` }}
        role="img"
        aria-label={t('alt')}
      />
    );
  } else if (query.isPending) {
    body = (
      <Skeleton
        key="loading"
        className="absolute inset-0 h-full w-full rounded-none"
        aria-label={t('loading')}
      />
    );
  } else if (query.isError) {
    const reason = query.error instanceof Error ? query.error.message : '';
    const isNotFound = reason === 'not-found';
    body = (
      <motion.div
        key="error"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
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
            <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
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
      </motion.div>
    );
  } else if (query.data.coverUrl) {
    // Keying on the URL forces a fresh mount when the cover changes,
    // so the fade-in animation replays for the new image instead of
    // hot-swapping in place.
    body = (
      <motion.div
        key={`cover-${query.data.coverUrl}`}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${query.data.coverUrl})` }}
        role="img"
        aria-label={t('alt')}
      />
    );
  } else {
    body = (
      <motion.div
        key="placeholder"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        className="absolute inset-0"
        role="img"
        aria-label={t('alt')}
      >
        <Placeholder variant="soft" seed={query.data.id} />
      </motion.div>
    );
  }

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      {...rest}
    >
      <AnimatePresence initial={false} mode="wait">
        {body}
      </AnimatePresence>
      {children}
    </div>
  );
}
