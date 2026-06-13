'use client';

import { PlayCircleIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';

/** Anchor id of the device showcase the demo button scrolls to. */
export const DEMO_SECTION_ID = 'demo';

type HeroDemoButtonProps = {
  label: string;
};

/**
 * Hero CTA that smooth-scrolls down to the device showcase (the live product
 * demo). Honours the reader's reduced-motion preference; the target carries a
 * `scroll-mt-*` so it lands clear of the sticky site header. Client-only.
 */
export function HeroDemoButton({ label }: HeroDemoButtonProps) {
  function handleClick() {
    const target = document.getElementById(DEMO_SECTION_ID);
    if (!target) return;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }

  return (
    <Button
      variant="outline"
      className="h-12 w-full gap-2 rounded-lg px-5 text-base font-medium dark:bg-background dark:hover:bg-muted md:w-auto md:min-w-[120px]"
      onClick={handleClick}
    >
      <PlayCircleIcon className="size-[18px]" />
      {label}
    </Button>
  );
}
