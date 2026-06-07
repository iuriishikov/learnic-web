import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { getPublicUserProfile, UserProfile } from '@/features/user-profile';
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
    namespace: 'metadata.userProfile',
  });
  const result = await getPublicUserProfile(id);
  if (!result.ok) return metadata;
  return {
    ...metadata,
    title: result.profile.fullName,
    description: metadata.description,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const result = await getPublicUserProfile(id);
  if (!result.ok) {
    if (result.reason === 'not-found') notFound();
    throw new Error(`Failed to load user profile ${id}: ${result.reason}`);
  }

  return (
    <>
      <main className="flex-1">
        <UserProfile profile={result.profile} />
      </main>
      <SiteFooter />
    </>
  );
}
