'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { ImageOffIcon, RotateCwIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import { useTranslations } from 'next-intl';
import {
  forwardRef,
  useCallback,
  useState,
  type CSSProperties,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

export type ImageRoundness =
  | 'none'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | 'full';

export type ImageErrorDensity = 'auto' | 'text' | 'icon';

type NextImageInherited = Pick<
  NextImageProps,
  | 'fill'
  | 'width'
  | 'height'
  | 'sizes'
  | 'priority'
  | 'quality'
  | 'unoptimized'
  | 'loading'
  | 'placeholder'
  | 'blurDataURL'
>;

export type ImageProps = NextImageInherited & {
  src: string;
  alt: string;
  /** Wrapper className — controls outer box (size, rounding, aspect, …). */
  className?: string;
  /** Class merged onto the underlying <img>. */
  imageClassName?: string;
  /** Convenience radius for the wrapper. Use `className` for anything fancier. */
  rounded?: ImageRoundness;
  /** Object-fit on the loaded image. Defaults to `cover`. */
  fit?: 'cover' | 'contain';
  /** Open a fullscreen lightbox on click. */
  lightbox?: boolean;
  /** Caption shown under the image inside the lightbox. */
  caption?: string;
  /**
   * How much error UI to surface.
   *
   * - `'auto'` (default): container queries pick `'text'` ≥ 12rem, else `'icon'`.
   * - `'text'`: title + description + retry button.
   * - `'icon'`: a single icon, no copy, no button (click to retry).
   */
  errorSize?: ImageErrorDensity;
  /** Optional callback fired alongside the internal retry. */
  onRetry?: () => void;
};

const ROUND_CLASS: Record<ImageRoundness, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

const FADE = { duration: 0.2, ease: [0.32, 0.72, 0, 1] as const };

type ImageStatus = 'loading' | 'loaded' | 'error';

function withCacheBust(src: string, retryCounter: number): string {
  if (retryCounter === 0) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}_r=${retryCounter}`;
}

export const Image = forwardRef<HTMLDivElement, ImageProps>(function Image(
  {
    src,
    alt,
    className,
    imageClassName,
    rounded = 'none',
    fit = 'cover',
    lightbox = false,
    caption,
    errorSize = 'auto',
    onRetry,
    fill,
    width,
    height,
    sizes,
    priority,
    quality,
    unoptimized,
    loading,
    placeholder,
    blurDataURL,
  },
  ref,
) {
  const t = useTranslations('image');
  const reduceMotion = useReducedMotion();

  const [status, setStatus] = useState<ImageStatus>('loading');
  const [retryCounter, setRetryCounter] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Reset status + retry counter when the src changes externally, so a new
  // URL gets its own skeleton + fade-in. Derived in render per the canonical
  // React pattern — avoids the cascading-rerender lint on effect-driven setState.
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (trackedSrc !== src) {
    setTrackedSrc(src);
    setStatus('loading');
    setRetryCounter(0);
  }

  const handleLoad = useCallback(() => setStatus('loaded'), []);
  const handleError = useCallback(() => setStatus('error'), []);

  const handleRetry = useCallback(() => {
    setStatus('loading');
    setRetryCounter((n) => n + 1);
    onRetry?.();
  }, [onRetry]);

  const effectiveSrc = withCacheBust(src, retryCounter);
  const roundClass = ROUND_CLASS[rounded];

  // Intrinsic-size mode (width+height) lets the wrapper size itself naturally
  // and keep the skeleton+overlay aligned to the same box. `fill` mode requires
  // the caller's className to size + position the wrapper (we add `relative`).
  const wrapperStyle: CSSProperties | undefined =
    !fill && width != null && height != null
      ? { width: `${width}px`, height: `${height}px` }
      : undefined;

  return (
    <>
      <div
        ref={ref}
        data-slot="image"
        data-status={status}
        className={cn(
          '@container/image group/image isolate overflow-hidden',
          // In fill mode the consumer's container provides size + relative
          // positioning; we float to fill it. In intrinsic mode the wrapper
          // sizes itself via wrapperStyle and stays in normal flow.
          fill ? 'absolute inset-0' : 'relative inline-block',
          roundClass,
          className,
        )}
        style={wrapperStyle}
      >
        {/* Skeleton stays mounted while loading. Opacity-only exit so the
            image doesn't pop/squeeze in. */}
        <AnimatePresence initial={false}>
          {status === 'loading' ? (
            <motion.div
              key="image-skeleton"
              initial={reduceMotion ? false : { opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={FADE}
              aria-hidden
              className="absolute inset-0 z-0"
            >
              <Skeleton className={cn('size-full', roundClass)} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {status !== 'error' ? (
          <NextImage
            // Re-keying on retry triggers a fresh request rather than reusing
            // the cached failure response from the same <img> element.
            key={retryCounter}
            src={effectiveSrc}
            alt={alt}
            fill={fill}
            width={fill ? undefined : width}
            height={fill ? undefined : height}
            sizes={sizes}
            priority={priority}
            quality={quality}
            unoptimized={unoptimized}
            loading={loading}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'relative z-[1] block size-full transition-opacity duration-200',
              fit === 'cover' ? 'object-cover' : 'object-contain',
              status === 'loaded' ? 'opacity-100' : 'opacity-0',
              imageClassName,
            )}
          />
        ) : null}

        {status === 'error' ? (
          <ImageErrorState
            density={errorSize}
            onRetry={handleRetry}
            title={t('errorTitle')}
            description={t('errorDescription')}
            retryLabel={t('retry')}
            iconLabel={t('errorIconLabel')}
          />
        ) : null}

        {lightbox && status === 'loaded' ? (
          <button
            type="button"
            aria-label={t('openFullscreen')}
            onClick={() => setLightboxOpen(true)}
            className={cn(
              'absolute inset-0 z-[2] cursor-zoom-in',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              roundClass,
            )}
          >
            <span className="sr-only">{t('openFullscreen')}</span>
          </button>
        ) : null}
      </div>

      {lightbox ? (
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          src={src}
          alt={alt}
          caption={caption}
          closeLabel={t('closeFullscreen')}
        />
      ) : null}
    </>
  );
});

/* -------------------------------------------------------------------------- */
/* Error state                                                                */
/* -------------------------------------------------------------------------- */

type ImageErrorStateProps = {
  density: ImageErrorDensity;
  onRetry: () => void;
  title: string;
  description: string;
  retryLabel: string;
  iconLabel: string;
};

function ImageErrorState({
  density,
  onRetry,
  title,
  description,
  retryLabel,
  iconLabel,
}: ImageErrorStateProps) {
  const reduceMotion = useReducedMotion();

  // Visibility rules:
  //   density === 'icon' → only the icon
  //   density === 'text' → only the rich block
  //   density === 'auto' → container query flips at 12rem (192px)
  const iconVisibility =
    density === 'icon'
      ? 'flex'
      : density === 'text'
        ? 'hidden'
        : 'flex @[12rem]/image:hidden';
  const richVisibility =
    density === 'text'
      ? 'flex'
      : density === 'icon'
        ? 'hidden'
        : 'hidden @[12rem]/image:flex';

  return (
    <motion.div
      key="image-error"
      role="alert"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={FADE}
      className="absolute inset-0 z-[3] flex items-center justify-center bg-muted/60 text-muted-foreground"
    >
      {/* Icon-only — also acts as a click target to retry on tiny avatars. */}
      <button
        type="button"
        onClick={onRetry}
        aria-label={iconLabel}
        title={iconLabel}
        className={cn(
          iconVisibility,
          'size-8 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        )}
      >
        <ImageOffIcon className="size-4" aria-hidden />
      </button>

      {/* Rich block — icon + title + description + retry button. */}
      <div
        className={cn(
          richVisibility,
          'max-w-[20rem] flex-col items-center gap-2 px-4 py-3 text-center',
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
          <ImageOffIcon className="size-5" aria-hidden />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {title}
          </p>
          <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="h-7 gap-1.5 px-2.5 text-xs"
        >
          <RotateCwIcon className="size-3" aria-hidden />
          {retryLabel}
        </Button>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lightbox                                                                   */
/* -------------------------------------------------------------------------- */

type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  caption?: string;
  closeLabel: string;
};

function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
  caption,
  closeLabel,
}: ImageLightboxProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          // Opacity-only fade — no scale, per the no-pop animation rule.
          className="fixed inset-0 z-50 bg-black/85 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 sm:p-8">
          <DialogPrimitive.Close
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-[1] bg-background/80 text-foreground shadow-sm ring-1 ring-border backdrop-blur-sm hover:bg-background sm:right-6 sm:top-6"
              />
            }
          >
            <XIcon aria-hidden />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>

          <div className="flex w-full flex-1 items-center justify-center overflow-hidden">
            {/* The lightbox image is a one-off render at native aspect ratio.
                We bypass next/image here because we don't know the dimensions
                in advance and don't want layout shift while we measure. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />
          </div>

          <DialogPrimitive.Title className="sr-only">
            {alt}
          </DialogPrimitive.Title>
          {caption ? (
            <DialogPrimitive.Description className="max-w-3xl text-center text-sm text-white/90 sm:text-base">
              {caption}
            </DialogPrimitive.Description>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
