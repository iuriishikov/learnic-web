import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { SiteFooter } from '@/widgets/site-footer';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

import { CoreValues } from './core-values';
import { TeamHero } from './team-hero';
import { TeamMembers } from './team-members';

type TeamPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: TeamPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'metadata.team',
  });
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <main className="flex-1">
        <TeamHero />
        <TeamMembers />
        <CoreValues />
      </main>
      <SiteFooter />
    </>
  );
}
