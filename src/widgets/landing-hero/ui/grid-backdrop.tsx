'use client';

import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';

const TOTAL_CELLS = 120;

const HIGHLIGHTED_INDICES = [
  2, 7, 13, 19, 25, 31, 37, 42, 48, 54, 60, 67, 73, 80, 88, 96, 104, 112,
] as const;

const HIGHLIGHTED_ORDER = new Map<number, number>(
  HIGHLIGHTED_INDICES.map((idx, i) => [idx, i]),
);

const FLIP_DURATION = 2;
const FLIP_REPEAT_DELAY = 2.4;
const FLIP_STAGGER = 0.28;

type GridBackdropProps = {
  className?: string;
};

export function GridBackdrop({ className }: GridBackdropProps) {
  const shouldReduceMotion = useReducedMotion();

  const cells = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const highlightIndex = HIGHLIGHTED_ORDER.get(i);
    const isHighlighted = highlightIndex !== undefined;

    cells.push(
      <div
        key={i}
        className="relative aspect-square border-b border-r border-border/80 [perspective:800px]"
      >
        {isHighlighted && (
          <motion.div
            aria-hidden
            className="absolute inset-0 origin-center bg-muted [backface-visibility:hidden] [transform-style:preserve-3d]"
            initial={
              shouldReduceMotion
                ? { opacity: 0.6, rotateY: 0 }
                : { opacity: 0, rotateY: -90 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 0.6, rotateY: 0 }
                : {
                    opacity: [0, 0.85, 0.85, 0],
                    rotateY: [-90, 0, 0, 90],
                  }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: FLIP_DURATION,
                    times: [0, 0.25, 0.75, 1],
                    delay: (highlightIndex ?? 0) * FLIP_STAGGER,
                    repeat: Infinity,
                    repeatDelay: FLIP_REPEAT_DELAY,
                    ease: 'easeInOut',
                  }
            }
          />
        )}
      </div>,
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        '[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent),linear-gradient(to_bottom,black,black_55%,transparent_100%)]',
        '[mask-composite:intersect]',
        '[-webkit-mask-composite:source-in]',
        className,
      )}
    >
      <div className="grid w-full [grid-template-columns:repeat(auto-fill,minmax(72px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(84px,1fr))] lg:[grid-template-columns:repeat(auto-fill,minmax(92px,1fr))]">
        {cells}
      </div>
    </div>
  );
}
