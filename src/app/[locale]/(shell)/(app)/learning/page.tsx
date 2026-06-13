import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { MyLearningView } from '@/features/products';
import { getEnrolledProducts } from '@/features/products/server';
import { httpStatusForReason } from '@/shared/lib/http-error';
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
    namespace: 'metadata.learning',
    noindex: true,
  });
}

export default async function LearningPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const result = await getEnrolledProducts();
  if (!result.ok) {
    // The enrolled list is this page's primary resource. An auth gap is
    // already handled by the `(app)` layout's redirect; a transient or
    // unknown backend failure goes to the 500 boundary rather than
    // faking an empty list. An *empty* list (`ok: true, items: []`) is a
    // success — the view renders its empty state.
    throw httpStatusForReason(
      result.reason,
      'Failed to load enrolled products',
    );
  }

  return <MyLearningView items={result.items} />;
}
