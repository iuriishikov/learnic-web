'use client';

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useState, type CSSProperties } from 'react';

import { Button } from '@/shared/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from '@/shared/ui/carousel';
import { Image, type ImageRoundness } from '@/shared/ui/image';

const DEFAULT_ASPECT_RATIO = 3 / 4;

const CONTAINER_VARIANTS: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
};

export type PhotoGalleryPhoto = {
  src: string;
  alt: string;
  /** Box shape as width / height. Defaults to a 3:4 portrait. */
  aspectRatio?: number;
  /**
   * Photo height as a fraction of the gallery height (0–1]. Defaults to 1.
   * Photos are top-aligned, so smaller factors leave air below — like a
   * magazine collage strip.
   */
  heightFactor?: number;
  /** Shown under the photo inside the lightbox (requires `lightbox`). */
  caption?: string;
};

export type PhotoGalleryProps = {
  photos: PhotoGalleryPhoto[];
  /**
   * Strip height in px for the tallest photo on `md:`+ viewports.
   * Below `md:` the strip scales down to 72% automatically.
   */
  height?: number;
  /**
   * How items are sized.
   * - `'fixed-height'` (default): every photo shares the strip height; width
   *   follows its `aspectRatio` / `heightFactor` (magazine strip).
   * - `'natural'`: the FIRST photo is a full-`height` hero; every later photo
   *   shares a slightly shorter height (`restHeightFactor` × `height`). Each
   *   photo keeps its real proportions (width = height × measured ratio), so
   *   nothing is cropped — heights vary only between the hero and the rest.
   */
  sizing?: 'fixed-height' | 'natural';
  /**
   * For `sizing="natural"`: height of every photo after the first, as a
   * fraction of `height` (the first photo is always the full-`height` hero).
   * Keep it close to 1 for a small hero/rest difference. Default 0.85.
   */
  restHeightFactor?: number;
  /** Corner radius forwarded to every photo's `Image`. */
  rounded?: ImageRoundness;
  /** Click any photo to open it fullscreen (with its `caption`, if set). */
  lightbox?: boolean;
  /** Forwarded to `next/image` — needed for hosts outside `remotePatterns`. */
  unoptimized?: boolean;
  /** Accessible name of the prev-arrow button. */
  prevLabel: string;
  /** Accessible name of the next-arrow button. */
  nextLabel: string;
  /** Accessible name of the whole gallery region. */
  ariaLabel: string;
  className?: string;
};

/**
 * Horizontal photo strip with natural, per-photo proportions: top-aligned
 * photos of differing heights, drag/swipe scrolling and round arrow buttons
 * below the strip. Built on the shared `Carousel` (embla) and `Image`
 * primitives, so every photo gets the skeleton, error-with-retry and optional
 * lightbox behavior for free. Arrow keys work while focus is inside.
 */
export function PhotoGallery({
  photos,
  height = 480,
  sizing = 'fixed-height',
  restHeightFactor = 0.85,
  rounded = 'none',
  lightbox = false,
  unoptimized = false,
  prevLabel,
  nextLabel,
  ariaLabel,
  className,
}: PhotoGalleryProps) {
  const reduceMotion = useReducedMotion();
  // Natural-mode only: index → measured naturalWidth / naturalHeight, so each
  // item box can adopt the photo's real proportions once it loads.
  const [naturalRatios, setNaturalRatios] = useState<Record<number, number>>({});

  if (photos.length === 0) return null;

  return (
    <motion.div
      initial={reduceMotion ? false : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={CONTAINER_VARIANTS}
      className={className}
    >
      <Carousel
        opts={{ align: 'start' }}
        aria-label={ariaLabel}
        className="flex flex-col gap-6 [--photo-gallery-h:calc(var(--photo-gallery-base)*0.72)] md:[--photo-gallery-h:var(--photo-gallery-base)]"
        style={
          {
            '--photo-gallery-base': `${height}px`,
            '--photo-gallery-h-rest': `calc(var(--photo-gallery-h) * ${restHeightFactor})`,
          } as CSSProperties
        }
      >
        {/* `items-start` top-aligns the varying-height photos in natural mode;
            harmless in fixed-height mode where every item is the same height. */}
        <CarouselContent className="-ml-6 items-start">
          {photos.map((photo, index) => {
            const fallbackRatio = photo.aspectRatio ?? DEFAULT_ASPECT_RATIO;
            const heightFactor = photo.heightFactor ?? 1;

            if (sizing === 'natural') {
              // The first photo is the full-height hero; every later photo
              // shares a slightly shorter height (`--photo-gallery-h-rest`).
              // Each keeps its real proportions (width = height × ratio), so
              // nothing is cropped and the only height difference is hero-vs-
              // rest. Until the image loads we hold a placeholder ratio so the
              // skeleton has a box; it snaps to the true ratio on load.
              const ratio = naturalRatios[index] ?? fallbackRatio;
              const itemHeight =
                index === 0 ? 'var(--photo-gallery-h)' : 'var(--photo-gallery-h-rest)';
              return (
                <CarouselItem key={`${photo.src}-${index}`} className="basis-auto pl-6">
                  <motion.div
                    variants={ITEM_VARIANTS}
                    className="relative"
                    style={{ height: itemHeight, aspectRatio: ratio }}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes={`${Math.round(height * Math.max(ratio, 0.75))}px`}
                      rounded={rounded}
                      fit="contain"
                      lightbox={lightbox}
                      caption={photo.caption}
                      unoptimized={unoptimized}
                      draggable={false}
                      onNaturalSize={({ width, height: h }) =>
                        setNaturalRatios((prev) => {
                          const next = width / h;
                          return prev[index] === next ? prev : { ...prev, [index]: next };
                        })
                      }
                    />
                  </motion.div>
                </CarouselItem>
              );
            }

            // Fixed-height (default): every photo shares the strip height; width
            // follows its aspect ratio (magazine strip).
            return (
              <CarouselItem key={`${photo.src}-${index}`} className="basis-auto pl-6">
                <motion.div
                  variants={ITEM_VARIANTS}
                  className="relative"
                  style={{
                    height: `calc(var(--photo-gallery-h) * ${heightFactor})`,
                    aspectRatio: fallbackRatio,
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes={`${Math.round(height * heightFactor * fallbackRatio)}px`}
                    rounded={rounded}
                    lightbox={lightbox}
                    caption={photo.caption}
                    unoptimized={unoptimized}
                    draggable={false}
                  />
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <PhotoGalleryNav prevLabel={prevLabel} nextLabel={nextLabel} />
      </Carousel>
    </motion.div>
  );
}

function PhotoGalleryNav({
  prevLabel,
  nextLabel,
}: {
  prevLabel: string;
  nextLabel: string;
}) {
  const { scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="size-11 touch-manipulation rounded-full md:size-9"
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        aria-label={prevLabel}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="size-11 touch-manipulation rounded-full md:size-9"
        disabled={!canScrollNext}
        onClick={scrollNext}
        aria-label={nextLabel}
      >
        <ArrowRightIcon />
      </Button>
    </div>
  );
}
