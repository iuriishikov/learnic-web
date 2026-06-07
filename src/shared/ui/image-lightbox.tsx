'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const DOUBLE_CLICK_SCALE = 2.5;
const BUTTON_STEP = 1.5;
const ZOOMED_EPSILON = 1.001;

const ZOOM_SPRING = { type: 'spring', stiffness: 260, damping: 28 } as const;
const INSTANT = { duration: 0 } as const;

/** Clamp a pan offset so the scaled image never detaches from the viewport. */
function clampOffset(
  value: number,
  fitted: number,
  scale: number,
  container: number,
): number {
  const max = Math.max(0, (fitted * scale - container) / 2);
  return Math.min(max, Math.max(-max, value));
}

export type ImageLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt: string;
  /** Shown in the bottom gradient bar. */
  caption?: string;
  closeLabel: string;
  zoomInLabel: string;
  zoomOutLabel: string;
  zoomResetLabel: string;
};

/**
 * Fullscreen photo viewer used by `Image`'s `lightbox` prop.
 *
 * Zoom & pan:
 * - double-click — toggle 100% ↔ 250% toward the cursor;
 * - mouse wheel / trackpad pinch — smooth zoom toward the cursor;
 * - drag — pan while zoomed in (constrained to the image bounds);
 * - toolbar — zoom out / current % (click to reset) / zoom in;
 * - keyboard — `+` / `-` / `0`, `Esc` closes.
 *
 * Known gap: true two-finger pinch on touchscreens isn't wired (trackpad
 * pinch works — it arrives as a ctrl+wheel event); double-tap and the
 * toolbar cover touch devices.
 */
export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt,
  caption,
  closeLabel,
  zoomInLabel,
  zoomOutLabel,
  zoomResetLabel,
}: ImageLightboxProps) {
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  // Mirrors `scale` for everything that needs a render: % readout, drag
  // constraints, cursor and disabled states.
  const [zoom, setZoom] = useState(1);

  // Stage element via callback ref — the Popup subtree mounts/unmounts with
  // `open`, so a plain ref would be stale for the ResizeObserver effect.
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  // Reset the transform on every fresh open (derived-in-render pattern).
  // MotionValue.set is an idempotent store write — safe to repeat in render.
  const [trackedOpen, setTrackedOpen] = useState(open);
  if (trackedOpen !== open) {
    setTrackedOpen(open);
    if (open) {
      scale.set(1);
      x.set(0);
      y.set(0);
      setZoom(1);
    }
  }

  useEffect(() => {
    if (!stageEl) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageSize({ w: width, h: height });
    });
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [stageEl]);

  // Rendered ("contain") size of the image at zoom 1. `max-w/h-full` never
  // upscales past the natural size, hence the `1` cap.
  const fitRatio = Math.min(
    stageSize.w && naturalSize.w ? stageSize.w / naturalSize.w : 0,
    stageSize.h && naturalSize.h ? stageSize.h / naturalSize.h : 0,
    1,
  );
  const fittedW = naturalSize.w * fitRatio;
  const fittedH = naturalSize.h * fitRatio;

  const applyZoom = useCallback(
    (
      next: number,
      focal: { px: number; py: number } | null,
      animated: boolean,
    ) => {
      const from = scale.get();
      const to = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
      const ratio = to / from;
      // Keep the focal point (cursor) fixed on screen: t₂ = P − (s₂/s₁)(P − t₁).
      const px = focal?.px ?? 0;
      const py = focal?.py ?? 0;
      const nextX =
        to === MIN_SCALE
          ? 0
          : clampOffset(px - ratio * (px - x.get()), fittedW, to, stageSize.w);
      const nextY =
        to === MIN_SCALE
          ? 0
          : clampOffset(py - ratio * (py - y.get()), fittedH, to, stageSize.h);
      const transition = animated && !reduceMotion ? ZOOM_SPRING : INSTANT;
      animate(scale, to, transition);
      animate(x, nextX, transition);
      animate(y, nextY, transition);
      setZoom(to);
    },
    [fittedW, fittedH, reduceMotion, scale, stageSize.w, stageSize.h, x, y],
  );

  // Wheel + trackpad-pinch zoom. React's synthetic `onWheel` is registered
  // passively, so `preventDefault` (needed to stop the page behind the dialog
  // from scrolling/zooming) only works through a native non-passive listener.
  useEffect(() => {
    if (!stageEl) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = stageEl.getBoundingClientRect();
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      // Trackpad pinch arrives as ctrl+wheel with small deltas — boost it.
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.012 : 0.0022));
      applyZoom(scale.get() * factor, { px, py }, false);
    };
    stageEl.addEventListener('wheel', onWheel, { passive: false });
    return () => stageEl.removeEventListener('wheel', onWheel);
  }, [applyZoom, scale, stageEl]);

  const handleDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!stageEl) return;
      const rect = stageEl.getBoundingClientRect();
      const px = event.clientX - rect.left - rect.width / 2;
      const py = event.clientY - rect.top - rect.height / 2;
      const zoomedIn = scale.get() > ZOOMED_EPSILON;
      applyZoom(zoomedIn ? MIN_SCALE : DOUBLE_CLICK_SCALE, { px, py }, true);
    },
    [applyZoom, scale, stageEl],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        applyZoom(scale.get() * BUTTON_STEP, null, true);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        applyZoom(scale.get() / BUTTON_STEP, null, true);
      } else if (event.key === '0') {
        event.preventDefault();
        applyZoom(MIN_SCALE, null, true);
      }
    },
    [applyZoom, scale],
  );

  const zoomed = zoom > ZOOMED_EPSILON;
  const maxPanX = Math.max(0, (fittedW * zoom - stageSize.w) / 2);
  const maxPanY = Math.max(0, (fittedH * zoom - stageSize.h) / 2);

  const toolButtonClass =
    'size-11 rounded-full text-white hover:bg-white/15 hover:text-white dark:hover:bg-white/15 lg:size-8';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          // Opacity-only fade — no scale, per the no-pop animation rule.
          className="fixed inset-0 z-50 bg-black/90 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Popup
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-50 flex flex-col outline-none data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          {/* Top chrome — controls float over the photo on a soft gradient. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-center justify-end gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 pb-10 sm:p-4 sm:pb-12">
            <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-white/10 p-1 ring-1 ring-white/15 backdrop-blur-md">
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyZoom(scale.get() / BUTTON_STEP, null, true)}
                disabled={!zoomed}
                aria-label={zoomOutLabel}
                title={`${zoomOutLabel} (−)`}
                className={toolButtonClass}
              >
                <ZoomOutIcon aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyZoom(MIN_SCALE, null, true)}
                disabled={!zoomed}
                aria-label={zoomResetLabel}
                title={`${zoomResetLabel} (0)`}
                className="h-11 min-w-14 rounded-full px-2 text-xs font-medium tabular-nums text-white/90 hover:bg-white/15 hover:text-white dark:hover:bg-white/15 lg:h-8 lg:min-w-12"
              >
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => applyZoom(scale.get() * BUTTON_STEP, null, true)}
                disabled={zoom >= MAX_SCALE - 0.01}
                aria-label={zoomInLabel}
                title={`${zoomInLabel} (+)`}
                className={toolButtonClass}
              >
                <ZoomInIcon aria-hidden />
              </Button>
            </div>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  className="pointer-events-auto size-11 rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20 hover:text-white dark:hover:bg-white/20 lg:size-8"
                />
              }
            >
              <XIcon aria-hidden />
              <span className="sr-only">{closeLabel}</span>
            </DialogPrimitive.Close>
          </div>

          {/* Stage — the whole area zooms and pans. */}
          <div
            ref={setStageEl}
            className="relative flex-1 overflow-hidden p-4 sm:p-6"
          >
            <motion.div
              style={{ x, y, scale }}
              drag={zoomed}
              dragConstraints={{
                left: -maxPanX,
                right: maxPanX,
                top: -maxPanY,
                bottom: maxPanY,
              }}
              dragElastic={0.08}
              dragMomentum={!reduceMotion}
              onDoubleClick={handleDoubleClick}
              className={cn(
                'flex h-full w-full select-none items-center justify-center',
                zoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
              )}
            >
              {/* One-off render at native aspect ratio. next/image is skipped
                  on purpose: dimensions are unknown in advance and we don't
                  want layout shift while measuring. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                draggable={false}
                onLoad={(event) =>
                  setNaturalSize({
                    w: event.currentTarget.naturalWidth,
                    h: event.currentTarget.naturalHeight,
                  })
                }
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </motion.div>
          </div>

          <DialogPrimitive.Title className="sr-only">
            {alt}
          </DialogPrimitive.Title>
          {caption ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-center bg-gradient-to-t from-black/60 to-transparent p-4 pt-10 sm:p-6 sm:pt-12">
              <DialogPrimitive.Description className="max-w-3xl text-center text-sm text-white/90 sm:text-base">
                {caption}
              </DialogPrimitive.Description>
            </div>
          ) : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
