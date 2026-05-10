'use client';

import {
  AnimatePresence,
  LazyMotion,
  domMax,
  m,
  useReducedMotion,
} from 'motion/react';

import { cn } from '@/shared/lib/utils';
import { NavTabsRouter, type NavTabRoute } from '@/shared/ui/nav-tabs-router';

export type AppSubHeaderTab = NavTabRoute;

export type AppSubHeaderProps = {
  /** Stable identifier for the current section. Drives the layoutId namespace and section transitions. */
  sectionKey: string;
  /** aria-label for the nav element. */
  ariaLabel: string;
  tabs: AppSubHeaderTab[];
  /** Active tab key. When omitted, the longest matching tab href against pathname wins. */
  activeKey?: string;
  className?: string;
};

export function AppSubHeader({
  sectionKey,
  ariaLabel,
  tabs,
  activeKey,
  className,
}: AppSubHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  const swapDuration = prefersReducedMotion ? 0 : 0.22;
  const swapEase: [number, number, number, number] = [0.32, 0.72, 0, 1];

  if (tabs.length === 0) return null;

  return (
    <LazyMotion features={domMax} strict>
      <div
        className={cn(
          'sticky top-[73px] z-30 border-b border-border bg-background',
          className,
        )}
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <m.div
              key={sectionKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: swapDuration, ease: swapEase }}
              className="-mx-4 px-4 py-2 md:-mx-8 md:px-8"
            >
              <NavTabsRouter
                tabs={tabs}
                activeKey={activeKey}
                variant="pill"
                layoutId={`app-sub-header-${sectionKey}`}
                ariaLabel={ariaLabel}
              />
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </LazyMotion>
  );
}
