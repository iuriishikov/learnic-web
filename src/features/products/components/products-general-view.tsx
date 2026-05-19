'use client';

import {
  GraduationCapIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useProductTags } from '@/features/product-tags';
import { useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { useMyProducts } from '../api/use-my-products';
import type { Product, ProductType } from '../model/types';

import { CreateProductDialog } from './create-product-dialog';
import { ProductCardSkeleton } from './product-card-skeleton';
import {
  ProductShowcaseCard,
  accentFromId,
} from './product-showcase-card';

type Filter = 'all' | ProductType;

type ProductsGeneralViewProps = {
  initialProducts: Product[];
};

export function ProductsGeneralView({
  initialProducts,
}: ProductsGeneralViewProps) {
  const t = useTranslations('teach-products.general');
  const tFilter = useTranslations('teach-products.filter');
  const reduceMotion = useReducedMotion();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyProducts(initialProducts);

  const products = useMemo<Product[]>(
    () => data?.pages.flat() ?? [],
    [data],
  );

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const counts = useMemo(() => {
    return products.reduce(
      (acc, p) => {
        acc.all += 1;
        acc[p.type] += 1;
        return acc;
      },
      { all: 0, course: 0 } as Record<Filter, number>,
    );
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return products.filter((p) => {
      if (filter !== 'all' && p.type !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLocaleLowerCase().includes(q) ||
        p.description.toLocaleLowerCase().includes(q)
      );
    });
  }, [products, filter, search]);

  const showEmpty = visible.length === 0 && !isFetchingNextPage;
  const isFiltered = search.trim().length > 0 || filter !== 'all';

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-3 md:mt-8 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList className="h-9">
            <FilterTab value="all" label={tFilter('all')} count={counts.all} />
            <FilterTab
              value="course"
              label={tFilter('courses')}
              count={counts.course}
            />
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-9 pl-8"
              aria-label={t('searchAriaLabel')}
            />
          </div>
          <CreateProductDialog
            trigger={
              <Button size="lg" className="h-9 gap-1.5">
                <PlusIcon /> {t('createCta')}
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {showEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <EmptyState filtered={isFiltered} />
            </motion.div>
          ) : (
            <motion.div key="grid" initial={false}>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((product, index) => (
                    <motion.li
                      key={product.id}
                      layout
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 12, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{
                        duration: 0.22,
                        delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.15),
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    >
                      <ProductGridCard product={product} />
                    </motion.li>
                  ))}
                </AnimatePresence>
                {isFetchingNextPage
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <li key={`skeleton-${i}`}>
                        <ProductCardSkeleton />
                      </li>
                    ))
                  : null}
              </ul>
              {hasNextPage ? (
                <div
                  ref={sentinelRef}
                  aria-hidden
                  className="h-px w-full"
                />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProductGridCard({ product }: { product: Product }) {
  const t = useTranslations('teach-products.card');
  const tType = useTranslations('teach-products.type');
  const format = useFormatter();
  const router = useRouter();

  const updated = format.relativeTime(new Date(product.updatedAt), {
    now: new Date(),
  });

  const { data: tags } = useProductTags(product.id);

  return (
    <ProductShowcaseCard
      type={product.type}
      typeLabel={tType(product.type)}
      title={product.title}
      durationLabel={t('stats.hours', { count: product.durationHours })}
      dueLabel={t('updated', { time: updated })}
      accent={accentFromId(product.id)}
      coverUrl={product.coverUrl}
      tags={tags}
      onClick={() => router.push(`/products/${product.id}/editor`)}
    />
  );
}

function FilterTab({
  value,
  label,
  count,
}: {
  value: Filter;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger value={value} className="gap-1.5">
      {label}
      <span
        className={cn(
          'inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/15 px-1.5 text-[10px] font-semibold leading-none text-muted-foreground tabular-nums',
          'group-data-[variant=default]/tabs-list:data-[active]:bg-foreground/10',
        )}
      >
        {count}
      </span>
    </TabsTrigger>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  const t = useTranslations('teach-products.empty');

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center md:py-20">
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          {filtered ? (
            <SearchIcon className="size-7" />
          ) : (
            <GraduationCapIcon className="size-7" />
          )}
        </div>
      </div>

      <div className="space-y-1.5 max-w-md">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {filtered ? t('filteredTitle') : t('title')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {filtered ? t('filteredDescription') : t('description')}
        </p>
      </div>

      {!filtered ? (
        <CreateProductDialog
          trigger={
            <Button size="lg" className="h-10 gap-1.5">
              <PlusIcon /> {t('cta')}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
