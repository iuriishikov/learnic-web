import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { getPublicUserProfile, UserProfile } from '@/features/user-profile';
import { QueryProvider } from '@/shared/api/query-provider';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

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
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <UserProfile profile={result.profile} />
        </main>
        <SiteFooter />
      </div>
    </QueryProvider>
  );
}
