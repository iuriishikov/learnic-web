import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/features/auth/server';
import { ProductInfoView } from '@/features/products';
import { getMyEnrollments, getProductById } from '@/features/products/server';
import { getUserPreview } from '@/features/user-profile';
import { httpStatusForReason } from '@/shared/lib/http-error';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { SiteFooter } from '@/widgets/site-footer';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const metadata = await buildPageMetadata({
    locale,
    namespace: 'metadata.marketplace',
    noindex: true,
  });
  const result = await getProductById(id);
  if (!result.ok) return metadata;
  return { ...metadata, title: result.product.title };
}

export default async function ProductLandingPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // The product is the page's primary resource — a load failure is a real
  // error, not a state to render around (see CLAUDE.md "Page-Level Failures").
  // `getProductById` is optional-auth, so anonymous marketplace visitors get
  // published products fine.
  const result = await getProductById(id);
  if (!result.ok) {
    if (result.reason === 'not-found') notFound();
    throw httpStatusForReason(result.reason, `Failed to load product ${id}`);
  }
  const product = result.product;

  // Secondary load: the author's avatar/verified badge live on their public
  // profile, not on `Product.author`. The lightweight preview slice (a single
  // `GET /users/{id}`) carries both fields — no need for the full profile
  // fan-out here. A failure must not break the page — the hero falls back to
  // initials with no badge.
  const authorPreview = await getUserPreview(product.author.id);
  const authorAvatarUrl =
    authorPreview.ok ? (authorPreview.preview.avatar?.url ?? null) : null;
  const authorIsVerified =
    authorPreview.ok ? authorPreview.preview.isVerified : false;

  // Secondary load: resolve whether the viewer is already enrolled so the hero
  // CTA can switch from «Записаться» to «Продолжить изучение». Anonymous
  // visitors are never enrolled; for signed-in users we read their enrollment
  // list and look for an active enrollment on this product. A failure here must
  // not break the page — we fall back to the un-enrolled CTA.
  const user = await getCurrentUser();
  let viewerEnrolled = false;
  if (user) {
    const enrollments = await getMyEnrollments();
    viewerEnrolled =
      enrollments.ok &&
      enrollments.enrollments.some(
        (enrollment) =>
          enrollment.productId === product.id &&
          enrollment.status === 'active',
      );
  }

  return (
    <>
      <main className="flex-1">
        <ProductInfoView
          product={product}
          authorAvatarUrl={authorAvatarUrl}
          authorIsVerified={authorIsVerified}
          viewerEnrolled={viewerEnrolled}
        />
      </main>
      <SiteFooter />
    </>
  );
}
