import { cn } from '@/shared/lib/utils';
import {
  brandPlaceholderFromSeed,
  softAccentFromSeed,
  softCoverGradient,
  type SoftAccent,
} from '@/shared/lib/placeholder-accent';
import { Image } from '@/shared/ui/image';

export type PlaceholderVariant = 'brand' | 'soft';

type CommonProps = {
  /** Seed used to deterministically pick a specific brand image or soft accent. */
  seed: string;
  className?: string;
};

type BrandProps = CommonProps & {
  variant: 'brand';
  /** Forwarded to next/image. Defaults to empty string for decorative placeholders. */
  alt?: string;
  priority?: boolean;
  sizes?: string;
};

type SoftProps = CommonProps & {
  variant: 'soft';
  /** Optional explicit accent override; otherwise derived from `seed`. */
  accent?: SoftAccent;
};

export type PlaceholderProps = BrandProps | SoftProps;

/**
 * Unified background placeholder. `brand` renders one of the project's SVG
 * gradients (picked deterministically by `seed`); `soft` renders the soft
 * watercolor gradient used on product cards.
 *
 * Wrap the placeholder in a positioned container — for `brand` the image uses
 * `next/image fill`, for `soft` the gradient div uses `absolute inset-0`.
 */
export function Placeholder(props: PlaceholderProps) {
  if (props.variant === 'brand') {
    const { seed, className, alt = '', priority, sizes } = props;
    return (
      <Image
        src={brandPlaceholderFromSeed(seed)}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(className)}
        // Decorative brand SVG — error UI would be noisy. Render an icon-only
        // fallback if the asset somehow 404s; tiny enough to blend in.
        errorSize="icon"
      />
    );
  }

  const accent = props.accent ?? softAccentFromSeed(props.seed);
  return (
    <div
      aria-hidden
      className={cn('absolute inset-0', props.className)}
      style={{ background: softCoverGradient(accent) }}
    />
  );
}
