import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { SalesDashboardView } from '@/features/sales-dashboard';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.teach.sales',
    noindex: true,
  });
}

export default async function TeachDashboardSalesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SalesDashboardView />;
}
