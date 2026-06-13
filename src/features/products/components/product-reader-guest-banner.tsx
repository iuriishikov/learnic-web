'use client';

import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Banner } from '@/shared/ui/banner';

import { enrollIntoProductAction } from '../api/enrollment-action';
import { noteLessonsPrefix } from '../api/use-note-lesson';
import { noteSchemeKey } from '../api/use-note-scheme';

type ProductReaderGuestBannerProps = {
  productId: string;
  loggedIn: boolean;
};

const BANNER_ID = 'reader-guest-enroll';
// Below the cookie-consent banner (priority 100) — legal prompt wins the
// single banner slot first; this surfaces once it's gone.
const BANNER_PRIORITY = 40;

/**
 * Enroll prompt for guest readers of a published, public note, rendered through
 * the shared {@link Banner} queue (so it shares the one bottom slot with
 * cookie-consent etc. and can be dismissed). Logged-out viewers are routed to
 * login; logged-in viewers self-enroll in place and the page re-renders without
 * the banner. A failed enroll swaps the copy for an inline error and the
 * primary button stays as the retry. Dismissing hides it for the session.
 */
export function ProductReaderGuestBanner({
  productId,
  loggedIn,
}: ProductReaderGuestBannerProps) {
  const t = useTranslations('product-reader');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const loginHref = `/login?from=/products/${productId}`;

  function handleEnroll() {
    if (pending) return;
    if (!loggedIn) {
      router.push(loginHref);
      return;
    }
    setFailed(false);
    startTransition(async () => {
      const result = await enrollIntoProductAction(productId);
      if (result.ok) {
        // The freshly-enrolled viewer reads their *pinned* release, which may
        // differ from the anonymous latest-published tree sitting in the
        // cache — drop it so the refreshed RSC pass re-seeds clean data.
        queryClient.invalidateQueries({
          queryKey: noteLessonsPrefix(productId),
        });
        queryClient.invalidateQueries({ queryKey: noteSchemeKey(productId) });
        // The banner disappears once the RSC tree re-renders the viewer as
        // enrolled — no toast needed on the happy path.
        router.refresh();
        return;
      }
      if (result.reason === 'unauthorized') {
        router.push(loginHref);
        return;
      }
      setFailed(true);
    });
  }

  return (
    <Banner
      id={BANNER_ID}
      priority={BANNER_PRIORITY}
      variant="plain"
      layout="auto"
      position="bottom"
      title={failed ? t('guest.errorTitle') : t('guest.label')}
      description={failed ? t('guest.errorDescription') : t('guest.hint')}
      primaryAction={{
        label: pending ? t('guest.enrolling') : t('guest.enroll'),
        onClick: handleEnroll,
      }}
      dismissable
      closeLabel={t('guest.dismiss')}
      onDismiss={() => setDismissed(true)}
    />
  );
}
