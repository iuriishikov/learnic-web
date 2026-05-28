'use client';

import type { ReactNode } from 'react';

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
  /**
   * Right-aligned content on the tab row — e.g. a `CommandSearchTrigger` that
   * opens a command palette. Sits opposite the tabs and stays on the same row.
   */
  endSlot?: ReactNode;
  className?: string;
};

export function AppSubHeader({
  sectionKey,
  ariaLabel,
  tabs,
  activeKey,
  endSlot,
  className,
}: AppSubHeaderProps) {
  if (tabs.length === 0 && !endSlot) return null;

  return (
    <div
      className={cn(
        'sticky top-[73px] z-30 border-b border-border bg-background',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
        <div className="-mx-4 flex items-center gap-4 px-4 py-2 md:-mx-8 md:px-8">
          {tabs.length > 0 && (
            <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
              <NavTabsRouter
                tabs={tabs}
                activeKey={activeKey}
                variant="pill"
                layoutId={`app-sub-header-${sectionKey}`}
                ariaLabel={ariaLabel}
              />
            </div>
          )}
          {endSlot && (
            <div className="ml-auto flex shrink-0 items-center">{endSlot}</div>
          )}
        </div>
      </div>
    </div>
  );
}
