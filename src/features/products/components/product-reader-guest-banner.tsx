'use client';

import { Loader2Icon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

import { enrollIntoProductAction } from '../api/enrollment-action';
import { noteContentKey } from '../api/use-note-content';

type ProductReaderGuestBannerProps = {
  productId: string;
  loggedIn: boolean;
};

/**
 * Sticky enroll prompt for guest readers of a published, public note. Anchored
 * to the viewport bottom; logged-out viewers are routed to login, logged-in
 * viewers self-enroll in place and the page re-renders without the banner.
 * A failed enroll swaps the hint line for an inline error — the button stays
 * as the retry affordance (no toast: the trigger is still on screen).
 */
export function ProductReaderGuestBanner({
  productId,
  loggedIn,
}: ProductReaderGuestBannerProps) {
  const t = useTranslations('product-reader');
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  const loginHref = `/login?from=/products/${productId}`;

  function handleEnroll() {
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
        queryClient.invalidateQueries({ queryKey: noteContentKey(productId) });
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
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-auto mx-auto mb-4 flex w-[calc(100%-2rem)] max-w-[640px] items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex min-w-0 flex-col">
          {failed ? (
            <>
              <span className="truncate text-sm font-medium text-destructive">
                {t('guest.errorTitle')}
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">
                {t('guest.errorDescription')}
              </span>
            </>
          ) : (
            <>
              <span className="truncate text-sm font-medium text-foreground">
                {t('guest.label')}
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">
                {t('guest.hint')}
              </span>
            </>
          )}
        </div>
        <Button
          type="button"
          onClick={handleEnroll}
          disabled={pending}
          /* h-11 keeps the CTA at the ≥44px touch minimum on phones/tablets. */
          className="h-11 shrink-0 bg-brand px-4 text-brand-foreground hover:bg-brand/90 lg:h-9 lg:px-3"
        >
          {pending ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : null}
          {t('guest.enroll')}
        </Button>
      </motion.div>
    </div>
  );
}
