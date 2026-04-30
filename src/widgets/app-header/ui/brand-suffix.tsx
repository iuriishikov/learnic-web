'use client';

import {
  AnimatePresence,
  LazyMotion,
  domMax,
  m,
  useReducedMotion,
} from 'motion/react';
import { useId, type ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type BrandSuffixProps = {
  /** The badge / decoration that follows the brand mark. Toggle by passing/omitting. */
  children?: ReactNode;
  /** Compact = used on mobile sheet (different layout context). */
  variant?: 'inline' | 'block';
  className?: string;
};

const SOFT_OUT = [0.22, 0.61, 0.36, 1] as const;

const LAYOUT_SPRING = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.7,
} as const;

/**
 * Animated wrapper for whatever sits to the right of the brand mark — typically
 * the "Studio" badge. Door-swing on enter/exit (hinged at the left edge so it
 * looks like the badge unfolds out of the brand mark), with a brand-tinted
 * shimmer sweeping across once it's open. The outer span animates its layout
 * width via FLIP so the surrounding content slides over smoothly instead of
 * snapping when the badge appears or disappears.
 */
export function BrandSuffix({
  children,
  variant = 'inline',
  className,
}: BrandSuffixProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion ?? false;
  // Stable per-instance id keeps multiple <BrandSuffix> on a page (e.g. desktop
  // + mobile) from sharing AnimatePresence state.
  const instanceId = useId();

  return (
    <LazyMotion features={domMax} strict>
      <m.span
        layout
        transition={{ layout: reduced ? { duration: 0 } : LAYOUT_SPRING }}
        className={cn(
          variant === 'inline' ? 'inline-flex items-center' : 'flex',
          // Inline variant owns the gap to the brand mark on its left so the
          // gap collapses when the badge unmounts. Block variant (mobile) sits
          // in its own row so no left spacing.
          variant === 'inline' && children ? 'ms-2' : '',
          className,
        )}
        style={{ perspective: '600px' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {children ? (
            <m.span
              key={`brand-suffix-${instanceId}`}
              initial={
                reduced
                  ? { opacity: 1 }
                  : { opacity: 0, rotateY: -85, x: -6, scale: 0.92 }
              }
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={
                reduced
                  ? { opacity: 0 }
                  : { opacity: 0, rotateY: 80, x: -4, scale: 0.92 }
              }
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 0.22, ease: SOFT_OUT },
                      rotateY: {
                        type: 'spring',
                        stiffness: 320,
                        damping: 26,
                        mass: 0.8,
                      },
                      x: {
                        type: 'spring',
                        stiffness: 320,
                        damping: 26,
                        mass: 0.8,
                      },
                      scale: {
                        type: 'spring',
                        stiffness: 380,
                        damping: 24,
                      },
                    }
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <span className="relative inline-flex items-center overflow-hidden rounded-md leading-none">
                {children}
                {!reduced ? (
                  <m.span
                    aria-hidden
                    initial={{ x: '-100%', opacity: 0 }}
                    animate={{ x: '130%', opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 0.7,
                      ease: SOFT_OUT,
                      delay: 0.28,
                    }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-brand/45 to-transparent"
                  />
                ) : null}
              </span>
            </m.span>
          ) : null}
        </AnimatePresence>
      </m.span>
    </LazyMotion>
  );
}
