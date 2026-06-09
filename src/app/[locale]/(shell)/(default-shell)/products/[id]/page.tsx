import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { getCurrentUser } from '@/features/auth/server';
import { ProductReaderView } from '@/features/products';
import {
  getMyEnrollments,
  getMySavedAnswers,
  getNoteContent,
  getProductById,
  type SavedBlockAnswer,
} from '@/features/products/server';
import { redirect } from '@/shared/config/i18n/navigation';
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
    namespace: 'metadata.productReader',
    noindex: true,
  });
  const result = await getProductById(id);
  if (!result.ok) return metadata;
  return { ...metadata, title: result.product.title };
}

export default async function ProductReaderPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // The product is the page's primary resource — a load failure is a real
  // error, not a state to render around. `getProductById` is optional-auth.
  const result = await getProductById(id);
  if (!result.ok) {
    if (result.reason === 'not-found') notFound();
    throw httpStatusForReason(result.reason, `Failed to load product ${id}`);
  }
  const product = result.product;

  const user = await getCurrentUser();

  // Secondary fetch — a failure here must not break the page; we simply treat
  // the viewer as not enrolled (they then see the guest reader + banner). The
  // active enrollment's id is threaded into the reader so the student can
  // self-switch their pinned release.
  let enrollmentId: string | null = null;
  if (user) {
    const enrollments = await getMyEnrollments();
    if (enrollments.ok) {
      const mine = enrollments.enrollments.find(
        (e) => e.productId === id && e.status === 'active',
      );
      enrollmentId = mine?.id ?? null;
    }
  }
  const enrolled = enrollmentId !== null;

  // Access gate: a non-enrolled viewer may only read a published, public
  // product. Anything else (private, unpublished, or both) routes back to the
  // marketplace landing where the «Запросить доступ» CTA lives.
  if (
    !enrolled &&
    !(product.visibility === 'public' && product.status === 'published')
  ) {
    redirect({ href: `/marketplace/${id}`, locale });
  }

  // Curriculum content — optional-auth, so enrolled viewers receive their
  // pinned release (cookies are forwarded by `apiFetch`). A 404 means the
  // release is genuinely gone; any other transient failure seeds `null` and
  // lets the client view recover via the query's retry state.
  const content = await getNoteContent(id);
  if (!content.ok && content.reason === 'not-found') notFound();
  const initialContent = content.ok ? content.content : null;

  // Saved answers — enrolled viewers only (a guest has none). Best-effort:
  // seeds the reader so the learner's previous selections + verdicts restore
  // without a flash; a failure just means a blank slate, never a broken page.
  let initialSavedAnswers: SavedBlockAnswer[] = [];
  if (enrolled) {
    const saved = await getMySavedAnswers(id);
    if (saved.ok) initialSavedAnswers = saved.answers;
  }

  return (
    <>
      <main className="flex-1">
        <ProductReaderView
          product={product}
          viewer={
            enrollmentId
              ? { kind: 'enrolled', enrollmentId }
              : { kind: 'guest', loggedIn: Boolean(user) }
          }
          initialContent={initialContent}
          initialSavedAnswers={initialSavedAnswers}
        />
      </main>
      {/* The marketing footer belongs to the anonymous reading experience
          only. Signed-in viewers — enrolled or just logged-in — read inside
          the app chrome and get no footer here. The top margin keeps it clear
          of the note content above. */}
      {!user && <SiteFooter className="mt-16 md:mt-24" />}
    </>
  );
}
