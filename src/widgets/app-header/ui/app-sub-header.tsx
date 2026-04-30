'use client';

import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
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

  const hasTabs = tabs.length > 0;

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.6 }}
      >
        <m.div
          aria-hidden={!hasTabs}
          initial={false}
          animate={{
            height: hasTabs ? 'auto' : 0,
            opacity: hasTabs ? 1 : 0,
          }}
          transition={{ duration: swapDuration, ease: swapEase }}
          className={cn(
            'sticky top-[73px] z-30 overflow-hidden bg-background',
            className,
          )}
        >
          <div
            className={cn(
              'transition-colors duration-200',
              hasTabs ? 'border-b border-border' : 'border-b-0',
            )}
          >
            <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
              <AnimatePresence mode="popLayout">
                {hasTabs ? (
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
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
