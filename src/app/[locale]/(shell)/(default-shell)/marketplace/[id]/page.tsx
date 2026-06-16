import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/features/auth/server';
import { ProductInfoView } from '@/features/products';
import {
  getMyEffectivePermissions,
  getMyEnrollments,
  getProductById,
} from '@/features/products/server';
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

  // Secondary load: resolve the viewer's relationship to this product so the
  // hero CTA reflects access they already hold instead of always offering an
  // enroll / request affordance. Two independent signals, both best-effort
  // (a failure must not break the page — we just fall back to the
  // un-enrolled, no-access CTA):
  //   • `viewerEnrolled` — an active enrollment ⇒ «Продолжить изучение» (reader).
  //   • `viewerCanManage` — owner or collaborator (a resolved rank, i.e.
  //     `hierarchyPosition !== null`) ⇒ «Открыть» (editor). This is what fixed
  //     a collaborator/owner being shown «Запросить доступ» on their own
  //     invite-only note: collaboration is NOT an enrollment, so the enrollment
  //     probe alone never saw them. Anonymous visitors hold neither.
  const user = await getCurrentUser();
  let viewerEnrolled = false;
  let viewerCanManage = false;
  if (user) {
    const [enrollments, permissions] = await Promise.all([
      getMyEnrollments(),
      getMyEffectivePermissions(id),
    ]);
    viewerEnrolled =
      enrollments.ok &&
      enrollments.enrollments.some(
        (enrollment) =>
          enrollment.productId === product.id &&
          enrollment.status === 'active',
      );
    viewerCanManage =
      permissions.ok && permissions.data.hierarchyPosition !== null;
  }

  return (
    <>
      <main className="flex-1">
        <ProductInfoView
          product={product}
          authorAvatarUrl={authorAvatarUrl}
          authorIsVerified={authorIsVerified}
          viewerEnrolled={viewerEnrolled}
          viewerCanManage={viewerCanManage}
        />
      </main>
      <SiteFooter />
    </>
  );
}
