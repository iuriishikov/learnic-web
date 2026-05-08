import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ProductEditorView } from '@/features/products';
import { getProductById } from '@/features/products/server';
import { httpStatusForReason } from '@/shared/lib/http-error';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { BreadcrumbConfig } from '@/widgets/app-header';

const RAIL_COOKIE = 'learnic.product-editor.rail-closed';
const SIDEBAR_WIDTH_COOKIE = 'learnic.product-editor.sidebar-width';
const SIDEBAR_MIN_WIDTH = 160;
const SIDEBAR_MAX_WIDTH = 360;
const SIDEBAR_DEFAULT_WIDTH = 200;

function parseSidebarWidth(raw: string | undefined): number {
  if (!raw) return SIDEBAR_DEFAULT_WIDTH;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return SIDEBAR_DEFAULT_WIDTH;
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.teach.editor',
    noindex: true,
  });
}

export default async function ProductEditorPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getProductById(id);
  if (!result.ok) {
    if (result.reason === 'not-found') notFound();
    throw httpStatusForReason(result.reason, `Failed to load product ${id}`);
  }
  const product = result.product;

  const t = await getTranslations({
    locale,
    namespace: 'teach-products.editor',
  });
  const breadcrumbLabel =
    product.title.trim().length > 0 ? product.title : t('untitled');

  const cookieStore = await cookies();
  const initialRailOpen = cookieStore.get(RAIL_COOKIE)?.value !== '1';
  const initialSidebarWidth = parseSidebarWidth(
    cookieStore.get(SIDEBAR_WIDTH_COOKIE)?.value,
  );

  return (
    <>
      <BreadcrumbConfig
        slot="product-editor"
        order={3}
        segments={[{ label: breadcrumbLabel }]}
      />
      <ProductEditorView
        product={product}
        initialRailOpen={initialRailOpen}
        initialSidebarWidth={initialSidebarWidth}
      />
    </>
  );
}

