import type { ReactNode } from 'react';

import { type SoftAccent } from '@/shared/lib/placeholder-accent';
import { cn } from '@/shared/lib/utils';
import { Image } from '@/shared/ui/image';
import { Placeholder } from '@/shared/ui/placeholder';
import { Skeleton } from '@/shared/ui/skeleton';

export type CoverImageProps = {
  /** Resolved cover URL. `null`/`undefined` falls back to the soft placeholder. */
  src?: string | null;
  /** Alt text for the cover / aria-label for the placeholder. */
  alt: string;
  /**
   * Stable seed for the placeholder's soft accent — pass the entity id (or
   * title) so the same item always gets the same gradient across surfaces.
   */
  seed: string;
  /** Explicit accent override; otherwise derived from `seed`. */
  accent?: SoftAccent;
  /** The cover source itself is still loading (async fetch) → show a skeleton. */
  loading?: boolean;
  /** `next/image` `sizes` hint used when a real cover is shown. */
  sizes?: string;
  /** Sizing / aspect-ratio / rounding for the cover box (the box clips). */
  className?: string;
  /** Overlay content (badges, menus, …) rendered above the cover. */
  children?: ReactNode;
};

/**
 * The canonical cover surface: a skeleton while the source resolves, the cover
 * image once it's set (with the shared `Image`'s own load skeleton + fade-in +
 * error/retry), or the soft seeded `Placeholder` when there's no cover — the
 * same treatment used on product cards. The box clips its children, so pass
 * aspect ratio + rounding via `className`.
 */
export function CoverImage({
  src,
  alt,
  seed,
  accent,
  loading = false,
  sizes = '100vw',
  className,
  children,
}: CoverImageProps) {
  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {loading ? (
        <Skeleton className="absolute inset-0 size-full rounded-none" />
      ) : src ? (
        <Image src={src} alt={alt} fill sizes={sizes} unoptimized />
      ) : (
        <Placeholder variant="soft" seed={seed} accent={accent} />
      )}
      {children}
    </div>
  );
}
