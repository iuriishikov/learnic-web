import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import {
  MY_PRODUCTS_PAGE_SIZE,
  MY_PRODUCTS_PER_PAGE_OPTIONS,
  ProductsGeneralView,
} from '@/features/products';
import { getMyProducts } from '@/features/products/server';
import { httpStatusForReason } from '@/shared/lib/http-error';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

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
    namespace: 'metadata.teach.products',
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

export default async function TeachProductsGeneralPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const perPage = readNumberParam(
    sp.perPage,
    MY_PRODUCTS_PAGE_SIZE,
    1,
    MY_PRODUCTS_PER_PAGE_OPTIONS[
      MY_PRODUCTS_PER_PAGE_OPTIONS.length - 1
    ],
  );
  const page = readNumberParam(sp.page, 1, 1, 10_000);
  const q = readStringParam(sp.q);

  const result = await getMyProducts({
    offset: (page - 1) * perPage,
    limit: perPage,
    q,
  });
  if (!result.ok) {
    throw httpStatusForReason(result.reason, 'Failed to load products');
  }

  return (
    <ProductsGeneralView
      initialProducts={result.products}
      initialTotal={result.total}
      initialPage={page}
      initialPerPage={perPage}
      initialQuery={q ?? ''}
    />
  );
}
