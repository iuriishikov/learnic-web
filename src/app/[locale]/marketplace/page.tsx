import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import {
  getPopularTagsAction,
  getPublishedProductsAction,
  MarketplaceView,
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
} from '@/features/products';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import { PageHeader } from '@/widgets/page-header';
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

  // SSR fetch matches what the client will request on first paint,
  // so React Query hydrates from ``initialData`` and avoids a
  // double-fetch. Two slices in parallel — product page + popular
  // tags row — neither depends on the other.
  const [productsResult, popularTagsResult] = await Promise.all([
    getPublishedProductsAction({
      offset: (page - 1) * perPage,
      limit: perPage,
      q,
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
    <div className="flex min-h-screen flex-col bg-background">
      {/*
        Marketplace lives outside the ``(app)`` / ``(learn)`` /
        ``(teach)`` route groups, so it doesn't get a HeaderConfig
        from a parent layout. ``DefaultHeaderConfig`` contributes
        the three mode-entry tabs (find a course / my learning /
        teach) for the authenticated header on this public route.
      */}
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex-1">
        <MarketplaceView
          initialProducts={initialProducts}
          initialTotal={initialTotal}
          initialPage={page}
          initialPerPage={perPage}
          initialQuery={q ?? ''}
          popularTags={popularTags}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
