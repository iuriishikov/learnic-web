'use client';

import {
  GraduationCapIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import {
  type ReadonlyURLSearchParams,
  useSearchParams,
} from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from '@/shared/config/i18n/navigation';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import {
  MY_PRODUCTS_PAGE_SIZE,
  MY_PRODUCTS_PER_PAGE_OPTIONS,
  useMyProducts,
} from '../api/use-my-products';
import type { Product, ProductType } from '../model/types';

import { CreateProductDialog } from './create-product-dialog';
import { ProductCardSkeleton } from './product-card-skeleton';
import { ProductsPagination } from './products-pagination';
import {
  ProductShowcaseCard,
  accentFromId,
} from './product-showcase-card';

type Filter = 'all' | ProductType;

type ProductsGeneralViewProps = {
  initialProducts: Product[];
  initialTotal: number;
  initialPage: number;
  initialPerPage: number;
  initialQuery: string;
};

export function ProductsGeneralView({
  initialProducts,
  initialTotal,
  initialPage,
  initialPerPage,
  initialQuery,
}: ProductsGeneralViewProps) {
  const t = useTranslations('teach-products.general');
  const tFilter = useTranslations('teach-products.filter');
  const tPagination = useTranslations('teach-products.pagination');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  // Source of truth for page/perPage/q is the URL. Initial values
  // mirror what page.tsx resolved server-side so the first paint
  // matches without a hydration shift; subsequent reads come from
  // ``useSearchParams``.
  const urlPage = readUrlNumber(searchParams.get('page'), initialPage, 1);
  const urlPerPage = readUrlNumber(
    searchParams.get('perPage'),
    initialPerPage,
    1,
    MY_PRODUCTS_PER_PAGE_OPTIONS[
      MY_PRODUCTS_PER_PAGE_OPTIONS.length - 1
    ],
  );
  const urlQuery = searchParams.get('q') ?? initialQuery ?? '';

  // ``search`` is the live input value; ``debouncedSearch`` drives
  // the URL push (and the backend query) so we hit
  // ``/products/mine?q=`` once per typing pause, not per keystroke.
  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(search, 250);

  // Push URL when the debounced search diverges from the URL —
  // resets page to 1 since "page 5 of a different query" is
  // meaningless.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlQuery.trim()) return;
    pushUrl(router, pathname, searchParams, {
      page: 1,
      perPage: urlPerPage,
      q: trimmed.length >= 2 ? trimmed : null,
    });
    // urlPerPage is snapshot via the push; perPage changes go
    // through their own handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const [filter, setFilter] = useState<Filter>('all');

  const initialData = useMemo(
    () => ({ products: initialProducts, total: initialTotal }),
    [initialProducts, initialTotal],
  );

  const { data, isFetching, isPlaceholderData } = useMyProducts({
    page: urlPage,
    perPage: urlPerPage,
    q: urlQuery,
    initialPage:
      urlPage === initialPage &&
      urlPerPage === initialPerPage &&
      urlQuery.trim() === initialQuery.trim()
        ? initialData
        : undefined,
  });

  const products = useMemo(() => data?.products ?? [], [data]);
  const total = data?.total ?? initialTotal;
  const totalPages = Math.max(1, Math.ceil(total / urlPerPage));
  // Clamp displayed page — if the user paginates past the end and
  // then narrows the query, ``urlPage`` could outlive the new
  // page count.
  const activePage = Math.min(urlPage, totalPages);

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

  // Type filter still runs client-side over the current page —
  // there's only one product type today (``course``), so this is
  // decorative until a second type lands.
  const visible = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => p.type === filter);
  }, [products, filter]);

  const goToPage = (next: number) => {
    pushUrl(router, pathname, searchParams, {
      page: Math.min(Math.max(next, 1), totalPages),
      perPage: urlPerPage,
      q: urlQuery.trim().length >= 2 ? urlQuery.trim() : null,
    });
  };

  // First-load skeleton: only when we genuinely have nothing to
  // show. Subsequent page swaps use the ``isPlaceholderData`` dim
  // so the previous page stays visible while the next one loads.
  const showInitialSkeleton = isFetching && !data;
  const showEmpty = !showInitialSkeleton && visible.length === 0;
  const isFiltered =
    debouncedSearch.trim().length > 0 || filter !== 'all';

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
          {showInitialSkeleton ? (
            <motion.ul
              key="skeleton"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[repeat(auto-fill,minmax(360px,1fr))]"
            >
              {Array.from({ length: Math.min(urlPerPage, 6) }).map(
                (_, i) => (
                  <li key={i}>
                    <ProductCardSkeleton />
                  </li>
                ),
              )}
            </motion.ul>
          ) : showEmpty ? (
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
              <ul
                className={cn(
                  'grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] transition-opacity',
                  isPlaceholderData && 'opacity-70',
                )}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {visible.map((product) => (
                    <motion.li
                      key={product.id}
                      layout={reduceMotion ? false : true}
                      initial={reduceMotion ? undefined : { opacity: 0 }}
                      animate={reduceMotion ? undefined : { opacity: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                      <ProductGridCard product={product} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {total > 0 && !showInitialSkeleton && (
          <ProductsPagination
            activePage={activePage}
            totalPages={totalPages}
            onPageChange={goToPage}
            previousLabel={tPagination('previous')}
            nextLabel={tPagination('next')}
            positionLabel={(current, total) =>
              tPagination('position', { current, total })
            }
          />
        )}
      </div>
    </div>
  );
}

function readUrlNumber(
  raw: string | null,
  fallback: number,
  min: number,
  max?: number,
): number {
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  const capped =
    max !== undefined ? Math.min(Math.max(parsed, min), max) : Math.max(parsed, min);
  return capped;
}

function pushUrl(
  router: ReturnType<typeof useRouter>,
  pathname: ReturnType<typeof usePathname>,
  current: ReadonlyURLSearchParams,
  next: { page: number; perPage: number; q: string | null },
) {
  const params = new URLSearchParams(current.toString());
  if (next.page === 1) params.delete('page');
  else params.set('page', String(next.page));
  if (next.perPage === MY_PRODUCTS_PAGE_SIZE) {
    params.delete('perPage');
  } else {
    params.set('perPage', String(next.perPage));
  }
  if (next.q) params.set('q', next.q);
  else params.delete('q');
  const qs = params.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname);
}

function ProductGridCard({ product }: { product: Product }) {
  const t = useTranslations('teach-products.card');
  const tType = useTranslations('teach-products.type');
  const format = useFormatter();
  const router = useRouter();

  const updated = format.relativeTime(new Date(product.updatedAt), {
    now: new Date(),
  });

  return (
    <ProductShowcaseCard
      type={product.type}
      typeLabel={tType(product.type)}
      title={product.title}
      durationLabel={t('stats.hours', { count: product.durationHours })}
      dueLabel={t('updated', { time: updated })}
      accent={accentFromId(product.id)}
      coverUrl={product.cover?.url ?? null}
      tags={product.tags}
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
