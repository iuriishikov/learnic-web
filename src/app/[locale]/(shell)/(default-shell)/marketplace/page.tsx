import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { PRODUCT_TAGS_MAX } from '@/features/product-tags';
import {
  getPopularTagsAction,
  getPublishedProductsAction,
  MarketplaceView,
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
} from '@/features/products';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { SiteFooter } from '@/widgets/site-footer';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.marketplace',
    noindex: true,
  });
}

function readNumberParam(
  raw: string | string[] | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function readStringParam(
  raw: string | string[] | undefined,
): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function readTagsParam(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  // ``?tags=id1,id2`` — comma-separated tag ids. De-dupe and cap at
  // the per-product tag limit: more can never satisfy the AND filter,
  // and it bounds the backend ``tag_ids`` IN-list.
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return Array.from(new Set(ids)).slice(0, PRODUCT_TAGS_MAX);
}

export default async function MarketplacePage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const perPage = readNumberParam(
    sp.perPage,
    PUBLISHED_PRODUCTS_PAGE_SIZE,
    1,
    PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS[
      PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS.length - 1
    ],
  );
  const page = readNumberParam(sp.page, 1, 1, 10_000);
  const q = readStringParam(sp.q);
  const tags = readTagsParam(sp.tags);

  // SSR fetch matches what the client will request on first paint,
  // so React Query hydrates from ``initialData`` and avoids a
  // double-fetch. Two slices in parallel — product page + popular
  // tags row — neither depends on the other.
  const [productsResult, popularTagsResult] = await Promise.all([
    getPublishedProductsAction({
      offset: (page - 1) * perPage,
      limit: perPage,
      q,
      tagIds: tags,
    }),
    getPopularTagsAction({ limit: 20 }),
  ]);

  // Secondary loads: an empty first page still lets the SPA render
  // the search/filter UI + empty state — don't 5xx the whole route
  // when the backend is transient. Pagination + filter recover
  // client-side.
  const initialProducts = productsResult.ok ? productsResult.products : [];
  const initialTotal = productsResult.ok ? productsResult.total : 0;
  const popularTags = popularTagsResult.ok ? popularTagsResult.tags : [];

  return (
    <>
      <main className="flex-1">
        <MarketplaceView
          initialProducts={initialProducts}
          initialTotal={initialTotal}
          initialPage={page}
          initialPerPage={perPage}
          initialQuery={q ?? ''}
          initialTags={tags}
          popularTags={popularTags}
        />
      </main>
      <SiteFooter />
    </>
  );
}
