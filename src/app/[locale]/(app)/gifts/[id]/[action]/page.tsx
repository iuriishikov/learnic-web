import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getGiftAction, GiftLanding, isGiftAction } from '@/features/gifts';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type GiftActionPageProps = {
  params: Promise<{ locale: string; id: string; action: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: GiftActionPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, namespace: 'gifts', noindex: true });
}

export default async function GiftActionPage({
  params,
  searchParams,
}: GiftActionPageProps) {
  const { locale, id, action } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  if (!isGiftAction(action)) notFound();

  // Primary resource: the gift. `not-found` / `forbidden` (wrong
  // account or email) leave no page → 404. `unauthorized` is already
  // handled by the (app) layout's redirect to /login, but treat any
  // leak as not-found rather than a fake page. Network / unknown →
  // throw to the closest error boundary (500).
  const result = await getGiftAction({ giftId: id });
  if (!result.ok) {
    if (
      result.reason === 'not-found' ||
      result.reason === 'forbidden' ||
      result.reason === 'unauthorized'
    ) {
      notFound();
    }
    throw new Error(`Failed to load gift ${id}: ${result.reason}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 md:py-16 lg:py-20">
      <GiftLanding gift={result.gift} action={action} token={token ?? null} />
    </div>
  );
}
