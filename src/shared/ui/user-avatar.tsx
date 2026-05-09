'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircleIcon } from 'lucide-react';
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
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
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
  avatarUrl: string | null;
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
   * Auto-subscribe to the user's live presence over WS and render the online
   * indicator when they are online. Defaults to `true`. Pass `false` to opt
   * out — e.g. for guest avatars or surfaces where presence is irrelevant.
   * The avatar manages the subscription itself; callers should not pass an
   * online flag manually.
   */
  showStatus?: boolean;
  /** Avatar silhouette. Defaults to `square` (rounded square) per design. */
  shape?: AvatarShape;
  /**
   * Local file preview (e.g. picked from `<input type="file">` before save).
   * Takes precedence over `user.avatarUrl` and is shown immediately via a
   * managed object URL — no network request involved.
   */
  previewFile?: File | Blob | null;
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

export function UserAvatar({
  user,
  size,
  className,
  showLoadErrorIndicator = true,
  showStatus = true,
  shape = 'square',
  previewFile,
}: UserAvatarProps) {
  const t = useTranslations('app');
  const previewUrl = useObjectUrl(previewFile);
  const effectiveSrc = previewUrl ?? user?.avatarUrl ?? null;
  const hasUrl = Boolean(effectiveSrc);
  const [status, setStatus] = useState<AvatarLoadStatus>(
    hasUrl ? 'loading' : 'idle',
  );

  const isLoading = hasUrl && (status === 'idle' || status === 'loading');
  const isError = hasUrl && status === 'error';

  // Always call the hook (rules-of-hooks). When `showStatus` is false or no
  // user is provided, we pass `null` and the hook is a no-op (returns
  // `'unknown'` and never subscribes).
  const presence = usePresence(showStatus && user ? user.id : null);
  const isOnline = presence === 'online';

  const initials = buildUserInitials(user);
  const displayName = buildUserDisplayName(user);
  const colorClass = user
    ? AVATAR_COLOR_CLASSES[pickAvatarColorIndex(user.id)]
    : 'bg-muted';
  const showErrorBadge = showLoadErrorIndicator && isError;
  const showOnlineBadge = isOnline && !showErrorBadge;
  const onlineLabel = t('presence.online');

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
