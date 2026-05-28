'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircleIcon, BadgeCheckIcon } from 'lucide-react';
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
   * Drives the brand checkmark overlay when `statusType="verified"`.
   * Defaults to `false` when the caller doesn't carry the flag yet —
   * the badge stays hidden in that case, which is the safe default.
   */
  isVerified?: boolean;
};

/**
 * Which optional status overlay the avatar renders.
 *
 * - `'online'`: subscribe to the user's live presence and show the green
 *   online dot when they are online. Default.
 * - `'verified'`: show the brand-coloured verified checkmark when the
 *   user carries `isVerified: true`. Static; no presence subscription.
 * - `null`: render no status overlay (e.g. guest / settings preview
 *   avatars where presence and verification are both irrelevant).
 *
 * Only one overlay can be shown at a time — presence and verification
 * compete for the same corner of the avatar.
 */
export type AvatarStatusType = 'online' | 'verified' | null;

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
   * Which status overlay to show, if any. See {@link AvatarStatusType}.
   * Defaults to `'online'` — the avatar auto-subscribes to presence and
   * shows the online dot when the user is online. Pass `'verified'` to
   * surface the brand checkmark for verified users instead, or `null`
   * to render no overlay at all.
   */
  statusType?: AvatarStatusType;
  /** Avatar silhouette. Defaults to `square` (rounded square) per design. */
  shape?: AvatarShape;
  /**
   * Apply the design-system "halo" treatment — a soft outer ring and drop
   * shadow that lift the avatar off the surface. Defaults to `true`. Pass
   * `false` in dense or already-elevated contexts (e.g. inside a button or
   * popup trigger that has its own border / background).
   */
  halo?: boolean;
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

const SHAPE_RADIUS: Record<AvatarShape, { root: string; image: string; fallback: string; after: string }> = {
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
 * Tailwind radius class matching the avatar silhouette. Apply it to a wrapping
 * trigger (button, link, popover trigger) so its focus / open ring follows the
 * avatar shape — otherwise a square avatar ends up inside a circular ring.
 */
export function userAvatarRadiusClass(shape: AvatarShape = 'square'): string {
  return SHAPE_RADIUS[shape].root;
}

export function UserAvatar({
  user,
  size,
  className,
  showLoadErrorIndicator = true,
  statusType = 'online',
  shape = 'square',
  halo = true,
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
  // when the caller asked for the online overlay AND we actually have a
  // user — verified-mode avatars don't need presence at all.
  const presence = usePresence(
    statusType === 'online' && user ? user.id : null,
  );
  const isOnline = presence === 'online';

  const initials = buildUserInitials(user);
  const displayName = buildUserDisplayName(user);
  const colorClass = user
    ? AVATAR_COLOR_CLASSES[pickAvatarColorIndex(user.id)]
    : 'bg-muted';
  const showErrorBadge = showLoadErrorIndicator && isError;
  const showOnlineBadge =
    statusType === 'online' && isOnline && !showErrorBadge;
  const showVerifiedBadge =
    statusType === 'verified' &&
    Boolean(user?.isVerified) &&
    !showErrorBadge;
  const onlineLabel = t('presence.online');
  const verifiedLabel = t('verified.badge');

  const radius = SHAPE_RADIUS[shape];

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
        halo && avatarHaloClasses,
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
          className="bg-destructive text-white"
        >
          <AlertCircleIcon />
        </AvatarBadge>
      )}
      {showOnlineBadge && (
        <AvatarBadge
          aria-label={onlineLabel}
          title={onlineLabel}
          className="bg-online group-data-[size=sm]/avatar:size-1.5 group-data-[size=default]/avatar:size-2 group-data-[size=lg]/avatar:size-2.5"
        />
      )}
      {showVerifiedBadge && (
        <span
          aria-label={verifiedLabel}
          title={verifiedLabel}
          data-slot="avatar-verified-badge"
          className={cn(
            'absolute -right-0.5 -bottom-0.5 z-10 inline-flex items-center justify-center text-brand select-none',
            'group-data-[size=sm]/avatar:size-3 group-data-[size=default]/avatar:size-3.5 group-data-[size=lg]/avatar:size-4',
            '[&>svg]:size-full [&>svg]:drop-shadow-[0_1px_2px_rgb(0_0_0/0.25)]',
          )}
        >
          <BadgeCheckIcon strokeWidth={2.25} aria-hidden />
        </span>
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

