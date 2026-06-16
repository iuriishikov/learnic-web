'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { BriefcaseIcon, GlobeIcon, RotateCwIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';

// The hover preview needs real profile data, which is feature territory.
// Reaching into `user-profile` from `shared/ui/` is a deliberate exception to
// the "shared doesn't import from features" rule — same contract as
// `UserAvatar`'s presence integration: any caller can drop in `<UserLink>` and
// get the live preview without extra wiring. The import is deep on purpose:
// the feature barrel re-exports `server-only` modules and would poison the
// client bundle, while a `'use server'` action file is a safe RPC boundary
// for client imports (its own imports never reach the browser).
import { getUserPreviewAction } from '@/features/user-profile/api/get-user-preview-action';
import type { UserPreview } from '@/features/user-profile/model/preview';
import { Link } from '@/shared/config/i18n/navigation';
import { useHasHover } from '@/shared/hooks/use-has-hover';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/shared/ui/hover-card';
import { Skeleton } from '@/shared/ui/skeleton';
import { UserAvatar, type AvatarUser } from '@/shared/ui/user-avatar';

export type UserLinkPreviewLoader = (userId: string) => Promise<UserPreview>;

const defaultLoader: UserLinkPreviewLoader = async (userId) => {
  const result = await getUserPreviewAction(userId);
  if (!result.ok) throw new Error(result.reason);
  return result.preview;
};

/**
 * Project the caller-supplied {@link AvatarUser} seed into a full
 * {@link UserPreview} used as the hover card's placeholder. Only identity is
 * known up front (id / name / avatar / verified) — email, bio, cover and links
 * stay `null` until the real fetch fills them in on top.
 */
function seedToPreview(seed: AvatarUser): UserPreview {
  return {
    id: seed.id,
    fullName: seed.fullName,
    email: null,
    publicEmail: null,
    avatar: seed.avatar,
    cover: null,
    isVerified: seed.isVerified ?? false,
    description: null,
    websiteUrl: null,
    portfolioUrl: null,
  };
}

/**
 * Sliding 1px underline mirroring the global `.link` affordance (220ms,
 * left-anchored, `currentColor`) — but resting neutral and turning brand
 * violet only on hover / focus / while the preview card is open
 * (base-ui sets `data-popup-open` on the trigger).
 */
const TRIGGER_CLASSES = cn(
  'font-medium text-foreground',
  'bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-[position:0_100%] bg-no-repeat',
  'transition-[color,background-size] duration-[220ms]',
  'hover:text-brand hover:bg-[length:100%_1px]',
  'focus-visible:text-brand focus-visible:bg-[length:100%_1px]',
  'data-popup-open:text-brand data-popup-open:bg-[length:100%_1px]',
);

type UserLinkProps = {
  /** Target user's id (`oid`) — the link navigates to `/users/{userId}`. */
  userId: string;
  children: React.ReactNode;
  className?: string;
  /**
   * Preview data source override for demos and tests. Defaults to the real
   * `GET /users/{id}` server action. Results are cached per `userId`, so
   * two links with the same id share one request (and one cache entry —
   * don't mix different loaders under the same id).
   */
  loadPreview?: UserLinkPreviewLoader;
  /**
   * Extra content appended at the bottom of the preview card, below the
   * public-profile section and separated by a divider. Use it for context the
   * public profile doesn't carry — e.g. a team member's role and tenure. It
   * shows as soon as the card opens (even while the profile lazy-loads), so
   * caller-known context is instant. No effect on touch (no preview there).
   */
  previewExtra?: React.ReactNode;
  /**
   * Identity the caller already has on hand, shown as the preview header's
   * instant placeholder so the avatar + name paint immediately on first hover
   * instead of flashing a skeleton over data we already know. The lazy fetch
   * still runs and fills in email / bio / links on top. `AvatarUser` is the
   * same shape callers already pass to `<UserAvatar>`, so there's no extra
   * wiring.
   */
  seed?: AvatarUser;
};

/**
 * Inline link to a user's public page. On hover/focus the text turns brand
 * violet with a sliding underline, and a preview card pops up with the
 * user's profile — lazily fetched on first intent, with a layout-matching
 * skeleton while loading. On touch devices (no hover) it renders a plain
 * link: tap navigates, no peek.
 *
 * ```tsx
 * <p>
 *   Конспект подготовила <UserLink userId={author.id}>{author.fullName}</UserLink>.
 * </p>
 * ```
 */
export function UserLink({
  userId,
  children,
  className,
  loadPreview,
  previewExtra,
  seed,
}: UserLinkProps) {
  const hasHover = useHasHover();
  // Latched on the first hover/focus so the fetch starts during the
  // preview-card open delay (the skeleton often never gets to show);
  // never reset — react-query owns caching and staleness from here.
  const [intent, setIntent] = useState(false);
  const markIntent = () => setIntent(true);

  const placeholderData = useMemo(
    () => (seed ? seedToPreview(seed) : undefined),
    [seed],
  );

  const query = useQuery<UserPreview, Error>({
    queryKey: ['user-preview', userId],
    queryFn: () => (loadPreview ?? defaultLoader)(userId),
    enabled: hasHover && intent,
    // Paint the header from the caller's seed while the real profile loads,
    // so a hovered list never flashes a skeleton over identity we already
    // have. Not written to cache — the `/users/{id}` page still fetches fresh.
    placeholderData,
  });

  const link = (
    <Link
      href={`/users/${userId}`}
      className={cn(TRIGGER_CLASSES, className)}
      onPointerEnter={markIntent}
      onFocus={markIntent}
    >
      {children}
    </Link>
  );

  // Touch surfaces get the plain link — tap should navigate, not "peek".
  if (!hasHover) return link;

  return (
    <HoverCard>
      <HoverCardTrigger render={link} />
      <HoverCardContent className="w-72 p-0" sideOffset={8}>
        <UserLinkPreviewBody query={query} previewExtra={previewExtra} />
      </HoverCardContent>
    </HoverCard>
  );
}

function UserLinkPreviewBody({
  query,
  previewExtra,
}: {
  query: UseQueryResult<UserPreview, Error>;
  previewExtra?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <UserLinkPreviewProfile query={query} />
      {previewExtra ? (
        <div className="border-t border-border px-4 py-3">{previewExtra}</div>
      ) : null}
    </div>
  );
}

function UserLinkPreviewProfile({
  query,
}: {
  query: UseQueryResult<UserPreview, Error>;
}) {
  const t = useTranslations('app');

  // The popup is hover/focus-supplemental: base-ui never moves focus into
  // it, so the retry Button below is mouse-only. The popup body remounts on
  // every open, though — so a failed load auto-retries on re-open (re-hover,
  // or Shift+Tab back onto the link). That's the keyboard path to retry.
  const retriedOnMount = useRef(false);
  useEffect(() => {
    if (retriedOnMount.current) return;
    retriedOnMount.current = true;
    if (query.isError && !query.isFetching) void query.refetch();
  }, [query]);

  // With a `seed`, `query.data` is the placeholder even on a failed fetch —
  // prefer showing that known identity (+ the previewExtra footer) over an
  // error card. The retry-on-mount effect above still re-tries on re-open.
  if (query.isError && !query.data) {
    return (
      <div className="flex flex-col items-start gap-2.5 p-4">
        <p className="text-xs text-muted-foreground">{t('userLink.error')}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={query.isRefetching}
          onClick={() => void query.refetch()}
        >
          <RotateCwIcon className="size-3.5" />
          {t('userLink.retry')}
        </Button>
      </div>
    );
  }

  if (!query.data) {
    return (
      <div aria-busy="true" className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    );
  }

  const preview = query.data;
  const hasCover = preview.cover !== null;
  // The user chose to publish `publicEmail` — prefer it over the masked one.
  const email = preview.publicEmail ?? preview.email;

  const identity = (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-semibold text-foreground">
        {preview.fullName}
      </span>
      {email ? (
        <span className="truncate text-xs text-muted-foreground">{email}</span>
      ) : null}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col"
    >
      {preview.cover !== null ? (
        // Decorative banner, inset from the popup edges (mirroring how the
        // avatar sits inset on the banner itself). CSS background like
        // `UserCover` — presigned S3 URLs don't belong in the next/image
        // optimizer (the signed query string defeats its cache), and the
        // codebase renders covers this way already.
        <div
          aria-hidden
          className="mx-1 mt-1 h-20 rounded-t-md bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${preview.cover.url})` }}
        />
      ) : null}
      <div className="flex flex-col gap-3 p-4">
        {hasCover ? (
          // Banner layout: the avatar straddles the cover's bottom edge
          // (half over the image), with a popover-coloured ring to separate
          // it from the photo; the name drops below, Twitter-card style.
          <div className="flex flex-col gap-2">
            <UserAvatar
              size="lg"
              className="-mt-9 ring-2 ring-popover"
              user={{
                id: preview.id,
                fullName: preview.fullName,
                avatar: preview.avatar,
                isVerified: preview.isVerified,
              }}
            />
            {identity}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <UserAvatar
              size="lg"
              user={{
                id: preview.id,
                fullName: preview.fullName,
                avatar: preview.avatar,
                isVerified: preview.isVerified,
              }}
            />
            {identity}
          </div>
        )}
        {preview.description ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {preview.description}
          </p>
        ) : null}
        {preview.websiteUrl !== null || preview.portfolioUrl !== null ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {preview.websiteUrl !== null ? (
              <PreviewLinkChip href={preview.websiteUrl} icon={GlobeIcon}>
                {t('userLink.website')}
              </PreviewLinkChip>
            ) : null}
            {preview.portfolioUrl !== null ? (
              <PreviewLinkChip href={preview.portfolioUrl} icon={BriefcaseIcon}>
                {t('userLink.portfolio')}
              </PreviewLinkChip>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

/**
 * External link chip for the preview footer. Mouse-only by nature (base-ui
 * never moves focus into the popup) — a pure accelerator; both links are
 * keyboard-reachable on the `/users/{id}` page the trigger navigates to.
 */
function PreviewLinkChip({
  href,
  icon: Icon,
  children,
}: {
  href: string;
  icon: typeof GlobeIcon;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-brand"
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
    </a>
  );
}
