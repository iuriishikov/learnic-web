'use client';

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
  if (tabs.length === 0) return null;

  return (
    <div
      className={cn(
        'sticky top-[73px] z-30 border-b border-border bg-background',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
        <div className="-mx-4 px-4 py-2 md:-mx-8 md:px-8">
          <NavTabsRouter
            tabs={tabs}
            activeKey={activeKey}
            variant="pill"
            layoutId={`app-sub-header-${sectionKey}`}
            ariaLabel={ariaLabel}
          />
        </div>
      </div>
    </div>
  );
}
