'use client';

import { Fragment, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';

type TypewriterTitleProps = {
  text: string;
  className?: string;
};

const START_DELAY_MS = 320;
// Per-keystroke base delay: 35–110ms (≈ 540–1700 cpm) — close to a confident typist.
const BASE_DELAY_MIN_MS = 35;
const BASE_DELAY_RANGE_MS = 75;
// Word boundaries: humans rest briefly after a space.
const SPACE_EXTRA_MIN_MS = 60;
const SPACE_EXTRA_RANGE_MS = 140;
// Punctuation lands with a slightly longer settle.
const PUNCT_EXTRA_MIN_MS = 180;
const PUNCT_EXTRA_RANGE_MS = 120;
// Rare "thinking" pauses sprinkled across the line.
const THINKING_CHANCE = 0.06;
const THINKING_EXTRA_MIN_MS = 180;
const THINKING_EXTRA_RANGE_MS = 200;

export function TypewriterTitle({ text, className }: TypewriterTitleProps) {
  const reduceMotion = useReducedMotion();
  const [typedCount, setTypedCount] = useState<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;

    const total = text.length;
    // One-time animation kick-off: collapse the SSR-rendered full text to 0 so
    // typing starts from an empty heading. eslint-disable-next-line below: this
    // is intentional init, not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTypedCount(0);

    let count = 0;
    let timeoutId: number | null = null;
    let cancelled = false;

    function delayAfter(char: string | undefined): number {
      let delay = BASE_DELAY_MIN_MS + Math.random() * BASE_DELAY_RANGE_MS;
      if (char === ' ') {
        delay += SPACE_EXTRA_MIN_MS + Math.random() * SPACE_EXTRA_RANGE_MS;
      } else if (char && /[.,!?;:]/.test(char)) {
        delay += PUNCT_EXTRA_MIN_MS + Math.random() * PUNCT_EXTRA_RANGE_MS;
      }
      if (Math.random() < THINKING_CHANCE) {
        delay += THINKING_EXTRA_MIN_MS + Math.random() * THINKING_EXTRA_RANGE_MS;
      }
      return delay;
    }

    function typeNext() {
      if (cancelled || count >= total) return;
      count += 1;
      setTypedCount(count);
      if (count >= total) return;
      const justTyped = text[count - 1];
      timeoutId = window.setTimeout(typeNext, delayAfter(justTyped));
    }

    const startTimeout = window.setTimeout(typeNext, START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimeout);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [reduceMotion, text]);

  const characters = Array.from(text);
  const isAnimating = typedCount !== null && !reduceMotion;
  const visibleCount = isAnimating ? (typedCount as number) : characters.length;
  const isComplete = visibleCount >= characters.length;

  return (
    <h1 className={cn(className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {characters.map((char, index) => (
          <Fragment key={index}>
            {isAnimating && index === visibleCount && (
              <Cursor blinking={false} />
            )}
            <span
              style={{
                visibility: index < visibleCount ? 'visible' : 'hidden',
              }}
            >
              {char}
            </span>
          </Fragment>
        ))}
        {isAnimating && isComplete && <Cursor blinking />}
      </span>
    </h1>
  );
}

function Cursor({ blinking }: { blinking: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative inline-block w-0 align-baseline"
    >
      <motion.svg
        viewBox="0 0 12 48"
        preserveAspectRatio="none"
        className="absolute -left-[0.1em] -bottom-[0.08em] block h-[0.95em] w-[0.2em] fill-brand"
        animate={blinking ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
        transition={
          blinking
            ? {
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
                times: [0, 0.5, 0.5, 1],
              }
            : { duration: 0 }
        }
      >
        {/* I-beam: top serif, central bar, bottom serif as one path. */}
        <path d="M0,0 H12 V4 H7.5 V44 H12 V48 H0 V44 H4.5 V4 H0 Z" />
      </motion.svg>
    </span>
  );
}
