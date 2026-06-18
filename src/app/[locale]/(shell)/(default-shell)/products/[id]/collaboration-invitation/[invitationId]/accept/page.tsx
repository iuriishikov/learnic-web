import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/features/auth/server';
import { CollaborationInviteLanding } from '@/features/products';
import { redirect } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { HeaderActiveKey } from '@/widgets/app-header';

type PageProps = {
  params: Promise<{ locale: string; id: string; invitationId: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'collaboration-invite',
    noindex: true,
  });
}

export default async function CollaborationInviteAcceptPage({
  params,
  searchParams,
}: PageProps) {
  const { locale, id, invitationId } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  // `accept-by-token` requires an authenticated caller (the backend matches
  // the signed-in user to the invitee). The email recipient is often not
  // logged in on the device they open the link from, so gate here and carry
  // the full target — token included — through `?from=` so the accept fires
  // automatically once they return from /login.
  const user = await getCurrentUser();
  if (!user) {
    const target = `/products/${id}/collaboration-invitation/${invitationId}/accept${
      token ? `?token=${encodeURIComponent(token)}` : ''
    }`;
    redirect({ href: `/login?from=${encodeURIComponent(target)}`, locale });
  }

  return (
    <>
      {/* Shares the `/products` prefix with the «Преподавать» tab but isn't a
          teaching page — suppress the active-tab highlight, like the reader. */}
      <HeaderActiveKey value={null} />
      <main className="flex-1">
        <div className="mx-auto flex w-full max-w-md flex-col px-4 py-12 md:py-16 lg:py-20">
          <CollaborationInviteLanding
            productId={id}
            collaborationId={invitationId}
            token={token ?? null}
          />
        </div>
      </main>
    </>
  );
}
