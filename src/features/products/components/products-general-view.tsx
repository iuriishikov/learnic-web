'use client';

import { GraduationCapIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import { NavTabs, type NavTab } from '@/shared/ui/nav-tabs';

import {
  MY_PRODUCTS_PAGE_SIZE,
  MY_PRODUCTS_PER_PAGE_OPTIONS,
  useMyProducts,
} from '../api/use-my-products';
import { useCatalogSearchParams } from '../hooks/use-catalog-search-params';
import { shouldShowCatalogSkeleton } from '../lib/catalog-search';
import type { Product, ProductType } from '../model/types';

import { CreateProductDialog } from './create-product-dialog';
import { ProductResultsGrid } from './product-results-grid';
import { ProductsPagination } from './products-pagination';
import {
  ProductShowcaseCard,
  accentFromId,
} from './product-showcase-card';

type Filter = 'all' | ProductType;

const GRID_CLASS =
  'grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[repeat(auto-fill,minmax(360px,1fr))]';

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

  // URL-driven page/perPage/q + debounced search + transition. Shared
  // with the marketplace — ``isPending`` is what drives the skeleton on
  // every search/paginate (same UX as the marketplace).
  const catalog = useCatalogSearchParams({
    initialPage,
    initialPerPage,
    initialQuery,
    pageSize: MY_PRODUCTS_PAGE_SIZE,
    perPageMax:
      MY_PRODUCTS_PER_PAGE_OPTIONS[MY_PRODUCTS_PER_PAGE_OPTIONS.length - 1],
  });
  const { search, setSearch, debouncedSearch, urlPage, urlPerPage, urlQuery } =
    catalog;

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
  // Clamp displayed page — if the user paginates past the end and then
  // narrows the query, ``urlPage`` could outlive the new page count.
  const activePage = Math.min(urlPage, totalPages);

  const [filter, setFilter] = useState<Filter>('all');

  const counts = useMemo(() => {
    return products.reduce(
      (acc, p) => {
        acc.all += 1;
        acc[p.type] += 1;
        return acc;
      },
      { all: 0, note: 0 } as Record<Filter, number>,
    );
  }, [products]);

  const tabs: NavTab[] = [
    { key: 'all', label: tFilter('all'), badge: counts.all },
    { key: 'note', label: tFilter('notes'), badge: counts.note },
  ];

  // Type filter runs client-side over the current page — there's only
  // one product type today (``note``), so this is decorative until a
  // second type lands.
  const visible = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => p.type === filter);
  }, [products, filter]);

  const showSkeleton = shouldShowCatalogSkeleton({
    isPending: catalog.isPending,
    isFetching,
    isPlaceholderData,
    hasData: Boolean(data),
  });
  const isFiltered = debouncedSearch.trim().length > 0 || filter !== 'all';

  const goToPage = (next: number) => {
    catalog.push({ page: Math.min(Math.max(next, 1), totalPages) });
  };

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
        <NavTabs
          tabs={tabs}
          activeKey={filter}
          onChange={(key) => setFilter(key as Filter)}
          variant="underline"
          layoutId="my-products-tabs"
          ariaLabel={tFilter('ariaLabel')}
          className="border-b border-border"
        />

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
        <ProductResultsGrid
          items={visible}
          showSkeleton={showSkeleton}
          perPage={urlPerPage}
          gridClassName={GRID_CLASS}
          renderItem={(product) => <ProductGridCard product={product} />}
          empty={<EmptyState filtered={isFiltered} />}
          pagination={
            total > 0 ? (
              <ProductsPagination
                activePage={activePage}
                totalPages={totalPages}
                onPageChange={goToPage}
                previousLabel={tPagination('previous')}
                nextLabel={tPagination('next')}
                positionLabel={(current, totalCount) =>
                  tPagination('position', { current, total: totalCount })
                }
              />
            ) : null
          }
        />
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

  return (
    <ProductShowcaseCard
      type={product.type}
      typeLabel={tType(product.type)}
      title={product.title}
      description={product.description}
      durationLabel={
        product.durationHours > 0
          ? t('stats.hours', { count: product.durationHours })
          : null
      }
      dueLabel={t('updated', { time: updated })}
      accent={accentFromId(product.id)}
      coverUrl={product.cover?.url ?? null}
      tags={product.tags}
      onClick={() => router.push(`/products/${product.id}/editor`)}
    />
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
