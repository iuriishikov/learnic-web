import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { ProductInfoView } from '@/features/products';
import { getProductById } from '@/features/products/server';
import { getPublicUserProfile } from '@/features/user-profile';
import { httpStatusForReason } from '@/shared/lib/http-error';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import { PageHeader } from '@/widgets/page-header';
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
  // profile, not on `Product.author`. A failure here must not break the page —
  // the hero falls back to initials with no badge.
  const authorProfile = await getPublicUserProfile(product.author.id);
  const authorAvatarUrl =
    authorProfile.ok ? (authorProfile.profile.avatar?.url ?? null) : null;
  const authorIsVerified =
    authorProfile.ok ? authorProfile.profile.isVerified : false;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/*
        The landing lives outside the (app)/(learn)/(teach) route groups, like
        the marketplace index, so it doesn't inherit a HeaderConfig from a
        parent layout. DefaultHeaderConfig contributes the mode-entry tabs for
        the authenticated header on this public route.
      */}
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex-1">
        <ProductInfoView
          product={product}
          authorAvatarUrl={authorAvatarUrl}
          authorIsVerified={authorIsVerified}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
