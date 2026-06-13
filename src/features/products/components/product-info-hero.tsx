'use client';

import { ArrowLeftIcon, ClockIcon, Loader2Icon, LockIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useTransition } from 'react';

import { useAuth } from '@/shared/auth';
import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button, buttonVariants } from '@/shared/ui/button';
import { UserAvatar } from '@/shared/ui/user-avatar';
import { UserLink } from '@/shared/ui/user-link';

import { enrollIntoProductAction } from '../api/enrollment-action';
import { noteLessonsPrefix } from '../api/use-note-lesson';
import { noteSchemeKey } from '../api/use-note-scheme';
import { descriptionExcerpt } from '../lib/description-html';
import type { Product } from '../model/types';

import { ProductTypeChip, ProductVisibilityChip } from './product-info-badges';
import { ProductCover } from './product-cover';

type ProductInfoHeroProps = {
  product: Product;
  /**
   * Author's resolved avatar URL, looked up from their public profile at the
   * page level (`Product.author` itself carries no avatar). `null` when the
   * author has no avatar or the secondary profile fetch failed — `UserAvatar`
   * then falls back to initials.
   */
  authorAvatarUrl?: string | null;
  /** Author's verified badge, from the same public-profile lookup. */
  authorIsVerified?: boolean;
  /**
   * Whether the viewer already has an active enrollment on this product,
   * resolved server-side at the page level. Switches the enroll CTA to
   * «Продолжить изучение» (→ reader) instead of «Записаться».
   */
  viewerEnrolled?: boolean;
};

/**
 * «Спотлайт» hero for the public product landing: a full-bleed cover banner
 * (a share of the viewport, capped so it never gets gigantic on large
 * screens) with the type chip, title, lead, enroll CTA and author laid over
 * an ink scrim. The back-to-catalog link floats over the cover's top-left.
 * No editor affordances — those live in the teach editor, not the storefront.
 */
export function ProductInfoHero({
  product,
  authorAvatarUrl,
  authorIsVerified,
  viewerEnrolled,
}: ProductInfoHeroProps) {
  const t = useTranslations('marketplace.detail');
  const reduceMotion = useReducedMotion();
  // Same branch PageHeader uses to pick the header, so the back link always
  // sits on the rail of whichever header is actually rendered: the floating
  // SiteHeader card (anonymous, max-w-[1216px] px-4 md:px-6, bottom at
  // 112/120px from the pulled-up cover top) vs the solid AppHeader bar
  // (max-w-[1440px] px-4 md:px-8, bottom at 72px from the viewport top).
  const { user } = useAuth();
  const lead = descriptionExcerpt(product.description);

  return (
    /* Pulled up under the page header like LandingHero/ErrorContent
       (-mt-20 md:-mt-24 = header flow height + sticky offset) so the
       anonymous floating header card overlays the cover instead of
       leaving a page-background strip above it. Heights grow by the
       same amount, so the cover's bottom edge stays where it was. */
    <ProductCover
      productId={product.id}
      initialProduct={product}
      className="-mt-20 h-[calc(58svh+5rem)] max-h-[680px] min-h-[540px] w-full md:-mt-24 md:h-[calc(58svh+6rem)] md:max-h-[696px] md:min-h-[556px]"
    >
      {/* Legibility ink scrim for the white text laid over the cover.
          `pointer-events-none` keeps the cover's own error-state retry
          button clickable underneath. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
      />

      {/* Back link mirrors the centered container of the rendered header (see
          the useAuth note above) so it doesn't drift to the viewport edge on
          wide screens, and sits just below that header's bottom edge. The
          strip lets clicks fall through to the cover; only the link itself
          re-enables pointer events. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 z-10',
          user ? 'top-25 md:top-30' : 'top-28 md:top-34',
        )}
      >
        <div
          className={cn(
            'mx-auto w-full',
            user ? 'max-w-[1440px] px-4 md:px-8' : 'max-w-[1216px] px-4 md:px-6',
          )}
        >
          <Link
            href="/marketplace"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'pointer-events-auto h-9 gap-1.5 bg-black/25 px-3 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/40 hover:text-white',
            )}
          >
            <ArrowLeftIcon className="size-4" />
            {t('back')}
          </Link>
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        // The strip itself lets clicks fall through to the cover (its error
        // state has a retry button); only the real content blocks re-enable
        // pointer events for themselves.
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
      >
        <div className="mx-auto flex w-full max-w-[820px] flex-col items-start gap-3.5 px-5 pb-10 md:gap-4 md:px-6 md:pb-14 [&>*]:pointer-events-auto">
          <div className="flex flex-wrap items-center gap-2">
            <ProductTypeChip
              type={product.type}
              className="bg-white/15 text-white ring-white/25 backdrop-blur-sm"
            />
            {/* Private products stay visible in the catalog — the chip signals
                the learner can't self-enroll (access is by invite). */}
            {product.visibility === 'private' ? (
              <ProductVisibilityChip
                visibility={product.visibility}
                className="bg-white/15 text-white ring-white/25 backdrop-blur-sm"
              />
            ) : null}
          </div>

          <h1 className="text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-white md:text-4xl lg:text-5xl">
            {product.title}
          </h1>

          {lead ? (
            <p className="line-clamp-2 max-w-[44rem] text-pretty text-base leading-snug text-white/80 md:text-lg">
              {lead}
            </p>
          ) : null}

          <div className="mt-1 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <HeroEnroll product={product} viewerEnrolled={viewerEnrolled} />
            <AuthorRow
              product={product}
              authorAvatarUrl={authorAvatarUrl}
              authorIsVerified={authorIsVerified}
            />
          </div>
        </div>
      </motion.div>
    </ProductCover>
  );
}

/**
 * Enroll CTA, moved from the old sidebar rail into the hero. Three flows:
 *
 * - **Invite-only (`private`)** — «Запросить доступ»; still an honest
 *   placeholder ("in development" toast) since the access-request flow isn't
 *   built yet.
 * - **Already enrolled** — «Продолжить изучение»; routes straight to the
 *   reader (`/products/{id}`), no enroll call.
 * - **Open (`public`), not enrolled** — «Записаться». Anonymous viewers go
 *   straight to the reader (it owns its own guest/login affordance). Signed-in
 *   viewers fire {@link enrollIntoProductAction}; on success (or an
 *   `unauthorized` race, which the reader handles) we route to the reader,
 *   otherwise we surface the mapped error via a toast.
 */
function HeroEnroll({
  product,
  viewerEnrolled,
}: {
  product: Product;
  viewerEnrolled?: boolean;
}) {
  const t = useTranslations('marketplace.detail');
  const notify = useNotify();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  // A transient network failure keeps the CTA on screen — per the error
  // conventions it surfaces as a persistent inline Alert anchored to the
  // button (which doubles as the retry), not as a disappearing toast.
  const [networkError, setNetworkError] = useState(false);

  const isPrivate = product.visibility === 'private';
  const readerHref = `/products/${product.id}`;

  const onEnroll = () => {
    if (isPrivate) {
      notify.info(t('enroll.requestSoonTitle'), {
        description: t('enroll.requestSoonDescription'),
      });
      return;
    }

    if (viewerEnrolled) {
      router.push(readerHref);
      return;
    }

    // Anonymous: straight to the reader, which owns the guest/login flow.
    if (!user) {
      router.push(readerHref);
      return;
    }

    setNetworkError(false);
    startTransition(async () => {
      const result = await enrollIntoProductAction(product.id);
      if (result.ok) {
        // The enrollment pins a release; the cached anonymous
        // scheme/lessons on this very page may now be stale.
        queryClient.invalidateQueries({
          queryKey: noteLessonsPrefix(product.id),
        });
        queryClient.invalidateQueries({
          queryKey: noteSchemeKey(product.id),
        });
        router.push(readerHref);
        return;
      }
      // An `unauthorized` race (cookie expired between page load and click)
      // is handled by the reader's own guest/login affordance — route there
      // rather than dead-ending on a toast.
      if (result.reason === 'unauthorized') {
        router.push(readerHref);
        return;
      }
      if (result.reason === 'network') {
        setNetworkError(true);
        return;
      }
      notify.error(t('enroll.errorTitle'), {
        description: t(enrollErrorKey(result.reason)),
      });
    });
  };

  let label: string;
  if (isPrivate) {
    label = t('enroll.requestCta');
  } else if (viewerEnrolled) {
    label = t('enroll.continueCta');
  } else {
    label = t('enroll.cta');
  }

  return (
    <div className="flex flex-col items-start gap-2.5">
      <Button
        type="button"
        size="lg"
        onClick={onEnroll}
        disabled={isPending}
        className="h-12 bg-brand px-7 text-brand-foreground hover:bg-brand/90"
      >
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" aria-hidden />
        ) : null}
        {!isPending && isPrivate ? (
          <LockIcon className="size-4" aria-hidden />
        ) : null}
        {label}
      </Button>
      {networkError ? (
        /* Solid backdrop keeps the destructive Alert legible over the cover
           scrim. Cleared on the next click — the CTA itself is the retry. */
        <Alert
          variant="destructive"
          className="max-w-[26rem] bg-background/95 backdrop-blur-sm"
        >
          <AlertTitle>{t('enroll.errorTitle')}</AlertTitle>
          <AlertDescription>{t('enroll.errorNetwork')}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

/**
 * Maps an enroll failure reason (minus `unauthorized` and `network`, both
 * handled before this point) to its toast-description i18n key. Exhaustive
 * over the closed reason set — the `never`-typed default fails the build if
 * a variant is added.
 */
function enrollErrorKey(
  reason: 'not-found' | 'private' | 'unpublished' | 'unreleased' | 'conflict' | 'validation' | 'unknown',
): string {
  switch (reason) {
    case 'unreleased':
      return 'enroll.errorUnreleased';
    case 'unpublished':
      return 'enroll.errorUnpublished';
    case 'private':
      return 'enroll.errorPrivate';
    case 'not-found':
    case 'conflict':
    case 'validation':
    case 'unknown':
      return 'enroll.errorUnknown';
    default: {
      const exhaustive: never = reason;
      return exhaustive;
    }
  }
}

/** Author + duration line, colours flipped for the dark cover overlay. */
function AuthorRow({
  product,
  authorAvatarUrl,
  authorIsVerified,
}: ProductInfoHeroProps) {
  const t = useTranslations('marketplace.detail');

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/85">
      {/* `text-white` overrides UserLink's resting `text-foreground` for the
          dark cover overlay; the brand hover/preview behaviour stays. */}
      <UserLink
        userId={product.author.id}
        className="inline-flex items-center gap-2 text-white"
      >
        <UserAvatar
          user={{
            id: product.author.id,
            fullName: product.author.fullName,
            avatar: null,
            isVerified: authorIsVerified ?? false,
          }}
          imageUrl={authorAvatarUrl ?? null}
          size="sm"
        />
        {product.author.fullName}
      </UserLink>
      {product.durationHours > 0 ? (
        <>
          <span aria-hidden className="size-1 rounded-full bg-white/40" />
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="size-3.5" aria-hidden />
            {t('meta.durationValue', { hours: product.durationHours })}
          </span>
        </>
      ) : null}
    </div>
  );
}
