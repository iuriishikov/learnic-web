'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircleIcon, CheckIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

// `UserAvatar` is the standard avatar across the app and must auto-display
// presence everywhere it appears. That requires reading the presence context
// from inside `shared/ui/` — a deliberate exception to the "shared doesn't
// import from features" rule, justified by the contract that any caller can
// drop in `<UserAvatar>` and get the live indicator without extra wiring.
import { usePresence } from '@/features/presence';
import { useObjectUrl } from '@/shared/hooks/use-object-url';
import { cn } from '@/shared/lib/utils';
import type { ApiFile } from '@/shared/types/user';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
  avatarHaloClasses,
} from '@/shared/ui/avatar';
import { Skeleton } from '@/shared/ui/skeleton';

type AvatarLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

const AVATAR_COLOR_CLASSES = [
  'bg-avatar-1',
  'bg-avatar-2',
  'bg-avatar-3',
  'bg-avatar-4',
  'bg-avatar-5',
  'bg-avatar-6',
  'bg-avatar-7',
  'bg-avatar-8',
] as const;

const userAvatarVariants = cva('shrink-0', {
  variants: {
    size: {
      sm: 'size-6 text-xs',
      default: 'size-8 text-sm',
      lg: 'size-10 text-base',
    },
  },
  defaultVariants: { size: 'default' },
});

export type AvatarShape = 'square' | 'circle';

/**
 * Minimal projection of a user needed to render the project's standard avatar.
 * Decoupled from any feature's `User` model so the component can be used
 * across features without crossing boundaries.
 *
 * `fullName` follows the backend canonical order
 * (`Last First Patronymic`); initials are derived by taking the first
 * character of the first two whitespace-separated tokens.
 */
export type AvatarUser = {
  id: string;
  fullName: string;
  avatar: ApiFile | null;
  /**
   * Whether the platform granted this user the public "verified" badge.
   * Verified users get the brand checkmark overlay instead of the online
   * dot (see `showStatus`). Defaults to `false` when the caller doesn't
   * carry the flag yet — the avatar then falls back to presence, which is
   * the safe default.
   */
  isVerified?: boolean;
};

type AvatarUserName = Pick<AvatarUser, 'fullName'>;

type UserAvatarProps = VariantProps<typeof userAvatarVariants> & {
  user: AvatarUser | null | undefined;
  className?: string;
  /**
   * When the avatar image fails to load, render a destructive corner badge so
   * the broken-load state is distinguishable from "user has no avatar yet".
   */
  showLoadErrorIndicator?: boolean;
  /**
   * Whether the avatar renders its status overlay. Defaults to `true`.
   * The overlay resolves itself by priority — the two states compete for
   * the same corner, so only one ever shows:
   *
   * 1. verified user → brand checkmark (static; no presence subscription),
   * 2. unverified but online → green presence dot,
   * 3. neither → nothing.
   *
   * Pass `false` to render no overlay at all (e.g. guest / settings
   * preview avatars where presence and verification are both irrelevant).
   */
  showStatus?: boolean;
  /** Avatar silhouette. Defaults to `square` (rounded square) per design. */
  shape?: AvatarShape;
  /**
   * Local file preview (e.g. picked from `<input type="file">` before save).
   * Takes precedence over `user.avatar?.url` and is shown immediately via a
   * managed object URL — no network request involved.
   */
  previewFile?: File | Blob | null;
  /**
   * Direct image URL override. Takes precedence over `user.avatar?.url`
   * (but not over a live `previewFile`). Use it when the image source
   * isn't a backend `ApiFile` — e.g. mock / placeholder avatars, or any
   * caller that already has a plain URL. The usual error/loading
   * handling and the initials fallback still apply.
   */
  imageUrl?: string | null;
};

type AvatarRadiusSet = {
  root: string;
  image: string;
  fallback: string;
  after: string;
};

const SHAPE_RADIUS: Record<AvatarShape, AvatarRadiusSet> = {
  circle: {
    root: 'rounded-full',
    image: 'rounded-full',
    fallback: 'rounded-full',
    after: 'after:rounded-full',
  },
  square: {
    root: 'rounded-lg',
    image: 'rounded-lg',
    fallback: 'rounded-lg',
    after: 'after:rounded-lg',
  },
};

/**
 * At `sm` the avatar box is only 24px, where the shared `rounded-lg` (10px) is
 * ~42% of the side: the square collapses into a lopsided near-circle and the
 * bottom-right status badge lands in the rounded-away corner, so the online dot
 * reads as missing. Step the square radius down to `rounded-md` (8px, ~33% —
 * the proportion the `default` size already has) so the small avatar stays a
 * clean rounded square and the badge sits on the avatar edge. Circles, and the
 * larger sizes, are unaffected.
 */
const SQUARE_RADIUS_SM: AvatarRadiusSet = {
  root: 'rounded-md',
  image: 'rounded-md',
  fallback: 'rounded-md',
  after: 'after:rounded-md',
};

function resolveAvatarRadius(
  shape: AvatarShape,
  size: UserAvatarProps['size'],
): AvatarRadiusSet {
  if (shape === 'square' && size === 'sm') return SQUARE_RADIUS_SM;
  return SHAPE_RADIUS[shape];
}

/**
 * Tailwind radius class matching the avatar silhouette. Apply it to a wrapping
 * trigger (button, link, popover trigger) so its focus / open ring follows the
 * avatar shape — otherwise a square avatar ends up inside a circular ring. Pass
 * `size` when the wrapped avatar is `sm` so the ring tracks the stepped-down
 * radius the small square uses.
 */
export function userAvatarRadiusClass(
  shape: AvatarShape = 'square',
  size?: UserAvatarProps['size'],
): string {
  return resolveAvatarRadius(shape, size).root;
}

export function UserAvatar({
  user,
  size,
  className,
  showLoadErrorIndicator = true,
  showStatus = true,
  shape = 'square',
  previewFile,
  imageUrl,
}: UserAvatarProps) {
  const t = useTranslations('app');
  const previewUrl = useObjectUrl(previewFile);
  const effectiveSrc = previewUrl ?? imageUrl ?? user?.avatar?.url ?? null;
  const hasUrl = Boolean(effectiveSrc);
  const [status, setStatus] = useState<AvatarLoadStatus>(
    hasUrl ? 'loading' : 'idle',
  );

  const isLoading = hasUrl && (status === 'idle' || status === 'loading');
  const isError = hasUrl && status === 'error';

  // Always call the hook (rules-of-hooks). The hook is a no-op for `null`
  // (returns `'unknown'` and never subscribes); we only pass the real id
  // when the status overlay is on AND the user isn't verified — verified
  // avatars show the static checkmark and don't need presence at all.
  const presence = usePresence(
    showStatus && user && !user.isVerified ? user.id : null,
  );
  const isOnline = presence === 'online';

  const initials = buildUserInitials(user);
  const displayName = buildUserDisplayName(user);
  const colorClass = user
    ? AVATAR_COLOR_CLASSES[pickAvatarColorIndex(user.id)]
    : 'bg-muted';
  // Status cascade for the shared bottom-right corner: load-error wins,
  // then the verified checkmark, then the online dot, then nothing.
  const showErrorBadge = showLoadErrorIndicator && isError;
  const showVerifiedBadge =
    showStatus && Boolean(user?.isVerified) && !showErrorBadge;
  const showOnlineBadge =
    showStatus && !showVerifiedBadge && isOnline && !showErrorBadge;
  const onlineLabel = t('presence.online');
  const verifiedLabel = t('verified.badge');

  const radius = resolveAvatarRadius(shape, size);

  // Anchor the dot badges (online / load-error) just off the bottom-right
  // corner, the same offset the verified badge and the `/menu-demo` reference
  // use. The dot then sits centered on the corner — half on the avatar, half
  // proud of it — reading as a status indicator beside the avatar rather than
  // pasted flat onto its face.
  const dotBadgePosition = '-right-0.5 -bottom-0.5';

  return (
    // base-ui's `Avatar.Root` keeps the loaded-status in context and never
    // resets it when `Avatar.Image` unmounts — so removing the URL would
    // leave the fallback hidden. Toggling the React key on the URL ↔ no-URL
    // boundary forces a fresh mount and brings the fallback back.
    <Avatar
      key={hasUrl ? 'with-image' : 'no-image'}
      size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
      className={cn(
        userAvatarVariants({ size }),
        radius.root,
        radius.after,
        avatarHaloClasses,
        className,
      )}
    >
      {effectiveSrc ? (
        <AvatarImage
          src={effectiveSrc}
          alt={displayName}
          onLoadingStatusChange={setStatus}
          className={radius.image}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          'font-semibold tracking-tight',
          radius.fallback,
          isLoading
            ? 'bg-transparent p-0'
            : user
              ? cn(colorClass, 'text-avatar-foreground')
              : 'bg-muted text-muted-foreground',
        )}
      >
        {isLoading ? (
          <Skeleton className={cn('size-full', radius.fallback)} />
        ) : (
          initials
        )}
      </AvatarFallback>
      {showErrorBadge && (
        <AvatarBadge
          aria-label="Не удалось загрузить аватар"
          title="Не удалось загрузить аватар"
          className={cn('bg-destructive text-white', dotBadgePosition)}
        >
          <AlertCircleIcon />
        </AvatarBadge>
      )}
      {showOnlineBadge && (
        <AvatarBadge
          aria-label={onlineLabel}
          title={onlineLabel}
          className={cn(
            'bg-online',
            dotBadgePosition,
            'group-data-[size=sm]/avatar:size-1.5 group-data-[size=default]/avatar:size-2 group-data-[size=lg]/avatar:size-2.5',
          )}
        />
      )}
      {showVerifiedBadge && (
        // Built on `AvatarBadge` so it shares the online dot's chrome (filled
        // circle + `ring-background` cutout) — a solid brand disc with a bold
        // check stays legible on busy photos, unlike an outline glyph. The
        // base badge hides its icon at `sm`; the check is the whole point
        // here, so re-show and re-scale it per size.
        <AvatarBadge
          aria-label={verifiedLabel}
          title={verifiedLabel}
          data-slot="avatar-verified-badge"
          className={cn(
            'bg-brand text-brand-foreground',
            dotBadgePosition,
            'group-data-[size=sm]/avatar:size-3 group-data-[size=default]/avatar:size-3.5 group-data-[size=lg]/avatar:size-4',
            'group-data-[size=sm]/avatar:[&>svg]:block group-data-[size=sm]/avatar:[&>svg]:size-2',
            'group-data-[size=default]/avatar:[&>svg]:size-2.5',
            'group-data-[size=lg]/avatar:[&>svg]:size-3',
          )}
        >
          <CheckIcon strokeWidth={3.5} aria-hidden />
        </AvatarBadge>
      )}
    </Avatar>
  );
}

export function buildUserInitials(
  user: AvatarUserName | null | undefined,
): string {
  if (!user) return '?';
  const tokens = user.fullName
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 2);
  const initials = tokens.map((t) => t[0] ?? '').join('');
  return initials.length > 0 ? initials.toUpperCase() : '?';
}

export function buildUserDisplayName(
  user: AvatarUserName | null | undefined,
): string {
  if (!user) return '';
  return user.fullName.trim();
}

function pickAvatarColorIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % AVATAR_COLOR_CLASSES.length;
}

