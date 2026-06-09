'use client';

import { SearchIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import type { Tag } from '@/features/product-tags';
import { useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/ui/empty';
import { GridBackdrop } from '@/shared/ui/grid-backdrop';
import { TextInput } from '@/shared/ui/input-extended';

import {
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
  usePublishedProducts,
} from '../api/use-published-products';
import { useCatalogSearchParams } from '../hooks/use-catalog-search-params';
import { shouldShowCatalogSkeleton } from '../lib/catalog-search';
import type { Product } from '../model/types';

import { ProductResultsGrid } from './product-results-grid';
import { ProductsPagination } from './products-pagination';
import {
  ProductShowcaseCard,
  accentFromId,
} from './product-showcase-card';

const GRID_CLASS =
  'grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6';

type MarketplaceViewProps = {
  initialProducts: Product[];
  initialTotal: number;
  initialPage: number;
  initialPerPage: number;
  initialQuery: string;
  initialTags: string[];
  popularTags: Tag[];
};

export function MarketplaceView({
  initialProducts,
  initialTotal,
  initialPage,
  initialPerPage,
  initialQuery,
  initialTags,
  popularTags,
}: MarketplaceViewProps) {
  const t = useTranslations('marketplace');
  const tPagination = useTranslations('marketplace.pagination');
  const searchParams = useSearchParams();

  // URL-driven page/perPage/q + debounced search + transition, shared
  // with the teach catalog. ``isPending`` drives the skeleton on every
  // search/paginate/tag navigation.
  const catalog = useCatalogSearchParams({
    initialPage,
    initialPerPage,
    initialQuery,
    pageSize: PUBLISHED_PRODUCTS_PAGE_SIZE,
    perPageMax:
      PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS[
        PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS.length - 1
      ],
  });
  const { search, setSearch, debouncedSearch, urlPage, urlPerPage, urlQuery } =
    catalog;

  // Tag filter is marketplace-only URL state (``?tags=id1,id2``) — it
  // drives a real server query (AND across the ids). Read here and
  // threaded into both the query and ``push({ extra })`` so search /
  // pagination preserve the active filter.
  const urlTags = readUrlTags(searchParams.get('tags'), initialTags);
  const selectedTagIds = new Set(urlTags);
  const tagFilterActive = urlTags.length > 0;

  const initialData = useMemo(
    () => ({ products: initialProducts, total: initialTotal }),
    [initialProducts, initialTotal],
  );

  const { data, isFetching, isPlaceholderData } = usePublishedProducts({
    page: urlPage,
    perPage: urlPerPage,
    q: urlQuery,
    tagIds: urlTags,
    // Only hydrate the very first render — once the user paginates,
    // searches, or toggles a tag, the queryKey differs and
    // ``initialData`` is irrelevant.
    initialPage:
      urlPage === initialPage &&
      urlPerPage === initialPerPage &&
      urlQuery.trim() === initialQuery.trim() &&
      sameTags(urlTags, initialTags)
        ? initialData
        : undefined,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? initialTotal;
  const totalPages = Math.max(1, Math.ceil(total / urlPerPage));
  // Clamp displayed page — if the user paginates past the end and then
  // narrows the query, ``urlPage`` could outlive the new page count.
  const activePage = Math.min(urlPage, totalPages);

  const showSkeleton = shouldShowCatalogSkeleton({
    isPending: catalog.isPending,
    isFetching,
    isPlaceholderData,
    hasData: Boolean(data),
  });

  const goToPage = (next: number) => {
    catalog.push({ page: Math.min(Math.max(next, 1), totalPages) });
  };

  // Toggling a tag rewrites ``?tags=`` and resets to page 1 (the old
  // page index is meaningless against a different result set); ``q`` and
  // ``perPage`` ride along automatically because ``push`` preserves
  // params it isn't told to change.
  const toggleTag = (tagId: string) => {
    const nextTags = selectedTagIds.has(tagId)
      ? urlTags.filter((id) => id !== tagId)
      : [...urlTags, tagId];
    catalog.push({
      page: 1,
      extra: { tags: nextTags.length > 0 ? nextTags.join(',') : null },
    });
  };

  const clearTags = () => {
    catalog.push({ page: 1, extra: { tags: null } });
  };

  // "No results" CTA: drop every active filter (search + tags) in one
  // push so the user lands back on the full catalog.
  const clearAllFilters = () => {
    setSearch('');
    catalog.push({ page: 1, q: null, extra: { tags: null } });
  };

  return (
    <div className="flex flex-col">
      <MarketplaceHero
        title={t('page.title')}
        subtitle={t('page.subtitle')}
        searchAriaLabel={t('search.label')}
        searchPlaceholder={t('search.placeholder')}
        search={search}
        onSearchChange={setSearch}
      />

      <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-12 md:px-8 md:pb-16 lg:px-12">
        <PopularTagsRow
          tags={popularTags}
          selectedIds={selectedTagIds}
          onToggle={(tag) => toggleTag(tag.id)}
          onClear={clearTags}
          activeCount={urlTags.length}
        />

        <div className="mt-8 md:mt-10">
          <ProductResultsGrid
            items={products}
            showSkeleton={showSkeleton}
            perPage={urlPerPage}
            gridClassName={GRID_CLASS}
            renderItem={(product) => <MarketplaceCard product={product} />}
            empty={
              <EmptyState
                isFiltered={
                  debouncedSearch.trim().length > 0 || tagFilterActive
                }
                onClear={clearAllFilters}
              />
            }
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
      </section>
    </div>
  );
}

function readUrlTags(raw: string | null, fallback: string[]): string[] {
  // Param absent → fall back to the SSR-resolved tags (same pattern
  // as ``q``). Present (incl. an empty ``?tags=``) → parse the
  // comma-separated id list, de-duped.
  if (raw === null) return fallback;
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return Array.from(new Set(ids));
}

function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return [...a].sort().every((id, i) => id === sortedB[i]);
}


type MarketplaceHeroProps = {
  title: string;
  subtitle: string;
  searchAriaLabel: string;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (next: string) => void;
};

function MarketplaceHero({
  title,
  subtitle,
  searchAriaLabel,
  searchPlaceholder,
  search,
  onSearchChange,
}: MarketplaceHeroProps) {
  return (
    <section className="relative isolate w-full overflow-hidden">
      <div className="relative mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="relative pb-12 pt-12 md:pb-16 md:pt-16 lg:pb-20 lg:pt-20">
          <GridBackdrop
            extendToTop={false}
            className="-inset-x-8 -bottom-16 md:-inset-x-16 md:-bottom-20 lg:-inset-x-32 xl:-inset-x-48"
          />

          <div className="relative flex flex-col items-center text-center">
            <h1 className="max-w-3xl text-pretty text-4xl font-semibold leading-[1.08] tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground md:mt-5 md:text-base">
              {subtitle}
            </p>

            <div className="mt-7 w-full max-w-xl md:mt-10">
              <TextInput
                aria-label={searchAriaLabel}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.currentTarget.value)}
                leadingIcon={
                  <SearchIcon className="size-4" aria-hidden />
                }
                className="h-12 rounded-xl shadow-sm shadow-black/[0.04] ring-1 ring-foreground/10 backdrop-blur-sm dark:shadow-black/30"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


type MarketplaceCardProps = {
  product: Product;
};

/**
 * Marketplace cards render type pill + title + duration + tag chips
 * using ``product.tags`` embedded inline by the backend — no per-card
 * fetch. Tag filtering is server-side (``GET /products?tag_ids=…`` with
 * AND semantics), so every product reaching here is already a match.
 * The motion/list-presence wrapper lives in ``ProductResultsGrid``.
 */
function MarketplaceCard({ product }: MarketplaceCardProps) {
  const router = useRouter();
  const tCard = useTranslations('marketplace.card');

  return (
    // Card opens the public product landing (pre-enrollment detail) at
    // ``/marketplace/[id]``. ``ProductShowcaseCard`` turns interactive
    // (role=button + keyboard) once it gets an ``onClick``.
    <ProductShowcaseCard
      type="note"
      typeLabel={tCard('typeNote')}
      title={product.title}
      description={product.description}
      onClick={() => router.push(`/marketplace/${product.id}`)}
      durationLabel={
        product.durationHours > 0
          ? tCard('durationHours', { hours: product.durationHours })
          : null
      }
      accent={accentFromId(product.id)}
      coverUrl={product.cover?.url ?? null}
      tags={product.tags}
    />
  );
}


type PopularTagsRowProps = {
  tags: Tag[];
  selectedIds: Set<string>;
  onToggle: (tag: Tag) => void;
  onClear: () => void;
  activeCount: number;
};

function PopularTagsRow({
  tags,
  selectedIds,
  onToggle,
  onClear,
  activeCount,
}: PopularTagsRowProps) {
  const t = useTranslations('marketplace.tags');

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('sectionLabel')}
      </span>

      <ul className="flex flex-wrap justify-center gap-2">
        {tags.map((tag) => (
          <li key={tag.id}>
            <TagToggleChip
              tag={tag}
              selected={selectedIds.has(tag.id)}
              onToggle={() => onToggle(tag)}
            />
          </li>
        ))}
      </ul>

      {activeCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {t('clearLabel', { count: activeCount })}
        </Button>
      )}
    </div>
  );
}


type TagToggleChipProps = {
  tag: Tag;
  selected: boolean;
  onToggle: () => void;
};

function TagToggleChip({ tag, selected, onToggle }: TagToggleChipProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={cn(
        'group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
        'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        selected
          ? 'border-foreground bg-foreground text-background'
          : 'border-border/70 bg-card text-foreground hover:border-foreground/40 hover:bg-muted',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-2.5 shrink-0 rounded-full transition-opacity',
          selected ? 'opacity-90' : 'opacity-100',
        )}
        style={{ backgroundColor: tag.color }}
      />
      <span className="truncate">{tag.name}</span>
    </motion.button>
  );
}


type EmptyStateProps = {
  isFiltered: boolean;
  onClear: () => void;
};

function EmptyState({ isFiltered, onClear }: EmptyStateProps) {
  const t = useTranslations('marketplace.empty');
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>
          {isFiltered ? t('filteredTitle') : t('title')}
        </EmptyTitle>
        <EmptyDescription>
          {isFiltered ? t('filteredDescription') : t('description')}
        </EmptyDescription>
      </EmptyHeader>
      {isFiltered && (
        <EmptyContent>
          <Button type="button" variant="outline" onClick={onClear}>
            {t('clearAction')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
