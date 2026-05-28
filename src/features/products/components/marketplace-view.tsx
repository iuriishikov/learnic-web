'use client';

import { SearchIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type ReadonlyURLSearchParams,
  useSearchParams,
} from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { Tag } from '@/features/product-tags';
import { usePathname, useRouter } from '@/shared/config/i18n/navigation';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
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
import type { Product } from '../model/types';

import { ProductCardSkeleton } from './product-card-skeleton';
import { ProductsPagination } from './products-pagination';
import {
  ProductShowcaseCard,
  accentFromId,
} from './product-showcase-card';

type MarketplaceViewProps = {
  initialProducts: Product[];
  initialTotal: number;
  initialPage: number;
  initialPerPage: number;
  initialQuery: string;
  popularTags: Tag[];
};

export function MarketplaceView({
  initialProducts,
  initialTotal,
  initialPage,
  initialPerPage,
  initialQuery,
  popularTags,
}: MarketplaceViewProps) {
  const t = useTranslations('marketplace');
  const tPagination = useTranslations('marketplace.pagination');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Source of truth for page/perPage/q is the URL. Initial values
  // mirror what page.tsx resolved server-side so the first paint
  // matches without a hydration shift; subsequent reads come from
  // ``useSearchParams`` (router pushes update both URL and these).
  const urlPage = readUrlNumber(searchParams.get('page'), initialPage, 1);
  const urlPerPage = readUrlNumber(
    searchParams.get('perPage'),
    initialPerPage,
    1,
    PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS[
      PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS.length - 1
    ],
  );
  const urlQuery = searchParams.get('q') ?? initialQuery ?? '';

  // ``search`` is the live input value; ``debouncedSearch`` is what
  // actually drives the URL push (and therefore the backend query)
  // so we hit ``/products?q=`` once per typing pause, not per
  // keystroke.
  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebouncedValue(search, 250);

  // Push URL when the debounced search diverges from what's in the
  // URL — also resets page to 1 since "page 5 of a different
  // query" is meaningless.
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === urlQuery.trim()) return;
    pushUrl(router, pathname, searchParams, {
      page: 1,
      perPage: urlPerPage,
      q: trimmed.length >= 2 ? trimmed : null,
    });
    // urlPerPage covered as a snapshot; we intentionally don't
    // depend on it directly — perPage changes go through their own
    // handler with their own push.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const initialData = useMemo(
    () => ({ products: initialProducts, total: initialTotal }),
    [initialProducts, initialTotal],
  );

  const { data, isFetching, isPlaceholderData } = usePublishedProducts({
    page: urlPage,
    perPage: urlPerPage,
    q: urlQuery,
    // Only hydrate the very first render — once the user paginates,
    // the queryKey differs and ``initialData`` is irrelevant.
    initialPage:
      urlPage === initialPage &&
      urlPerPage === initialPerPage &&
      urlQuery.trim() === initialQuery.trim()
        ? initialData
        : undefined,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? initialTotal;
  const totalPages = Math.max(1, Math.ceil(total / urlPerPage));
  // Clamp displayed page — if the user paginates past the end and
  // then narrows the query, ``urlPage`` could outlive the new
  // page count. Don't trust the URL blindly when computing the
  // active page indicator.
  const activePage = Math.min(urlPage, totalPages);

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const selectedTagIds = useMemo(
    () => new Set(selectedTags.map((t) => t.id)),
    [selectedTags],
  );
  const tagFilterActive = selectedTags.length > 0;

  const goToPage = (next: number) => {
    pushUrl(router, pathname, searchParams, {
      page: Math.min(Math.max(next, 1), totalPages),
      perPage: urlPerPage,
      q: urlQuery.trim().length >= 2 ? urlQuery.trim() : null,
    });
  };

  // Show the layout-matching skeleton while we're swapping to a
  // page that isn't in cache yet. ``isPlaceholderData`` covers the
  // smooth prev/next case (TanStack keeps showing the last page);
  // we only force the skeleton block on first load with no data
  // at all.
  const showInitialSkeleton = isFetching && !data;

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
          onToggle={(tag) =>
            setSelectedTags((prev) =>
              prev.some((t) => t.id === tag.id)
                ? prev.filter((t) => t.id !== tag.id)
                : [...prev, tag],
            )
          }
          onClear={() => setSelectedTags([])}
          activeCount={selectedTags.length}
        />

        <div className="mt-8 md:mt-10">
          {showInitialSkeleton ? (
            <ul
              aria-hidden
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6"
            >
              {Array.from({ length: Math.min(urlPerPage, 6) }).map(
                (_, i) => (
                  <li key={i}>
                    <ProductCardSkeleton />
                  </li>
                ),
              )}
            </ul>
          ) : products.length === 0 ? (
            <EmptyState
              isFiltered={
                debouncedSearch.trim().length > 0 || tagFilterActive
              }
              onClear={() => {
                setSearch('');
                setSelectedTags([]);
              }}
            />
          ) : (
            <ul
              className={cn(
                'grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6 transition-opacity',
                // Subtle dim while a stale page is shown (TanStack
                // ``placeholderData`` keepalive) so it's clear new
                // data is on the way.
                isPlaceholderData && 'opacity-70',
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {products.map((product) => (
                  <MarketplaceCardWrapper
                    key={product.id}
                    product={product}
                    selectedTagIds={selectedTagIds}
                    tagFilterActive={tagFilterActive}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}

          {total > 0 && (
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
      </section>
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
  if (next.perPage === PUBLISHED_PRODUCTS_PAGE_SIZE) {
    params.delete('perPage');
  } else {
    params.set('perPage', String(next.perPage));
  }
  if (next.q) params.set('q', next.q);
  else params.delete('q');
  const qs = params.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname);
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


type MarketplaceCardWrapperProps = {
  product: Product;
  selectedTagIds: Set<string>;
  tagFilterActive: boolean;
};

/**
 * Marketplace cards render type pill + title + duration + tag chips
 * using ``product.tags`` embedded inline by the backend — no
 * per-card fetch. Until the backend grows
 * ``GET /products?tag_ids=…``, the same embedded set powers the
 * client-side tag filter when one is active.
 */
function MarketplaceCardWrapper({
  product,
  selectedTagIds,
  tagFilterActive,
}: MarketplaceCardWrapperProps) {
  const reduceMotion = useReducedMotion();
  const tCard = useTranslations('marketplace.card');
  const tags = product.tags;
  const productTagIds = useMemo(
    () => new Set(tags.map((t) => t.id)),
    [tags],
  );

  if (tagFilterActive) {
    const matchesAll = Array.from(selectedTagIds).every((id) =>
      productTagIds.has(id),
    );
    if (!matchesAll) return null;
  }

  return (
    // Opacity-only enter/exit + ``layout`` so filter changes
    // (search query + tag toggle) animate smoothly: items being
    // filtered out fade and the rest reflow into the gap.
    // ``AnimatePresence initial={false}`` on the parent suppresses
    // the fade on first paint, so cards never slide-down on
    // initial mount.
    <motion.li
      layout={reduceMotion ? false : true}
      initial={reduceMotion ? undefined : { opacity: 0 }}
      animate={reduceMotion ? undefined : { opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/*
        Detail-view route (e.g. ``/products/[id]``) does not exist
        yet for the marketplace flow — landing it later wires
        ``onClick`` here to ``router.push``. For now the card is
        intentionally non-interactive.
      */}
      <ProductShowcaseCard
        type="course"
        typeLabel={tCard('typeCourse')}
        title={product.title}
        durationLabel={
          product.durationHours > 0
            ? tCard('durationHours', { hours: product.durationHours })
            : tCard('durationUnset')
        }
        accent={accentFromId(product.id)}
        coverUrl={product.cover?.url ?? null}
        tags={tags}
      />
    </motion.li>
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
