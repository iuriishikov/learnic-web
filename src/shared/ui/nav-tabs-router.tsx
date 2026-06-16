'use client';

import { useRouter, usePathname } from '@/shared/config/i18n/navigation';
import { resolveActiveNavKey } from '@/shared/lib/nav-active-key';

import {
  NavTabs,
  type NavTab,
  type NavTabsVariant,
} from './nav-tabs';

export type NavTabRoute = NavTab & {
  href: string;
  /**
   * Optional override for the default pathname-prefix active rule — for a tab
   * whose `href` prefix is shared by an unrelated route. See
   * `resolveActiveNavKey`.
   */
  isActivePath?: (pathname: string) => boolean;
};

export type NavTabsRouterProps = {
  tabs: NavTabRoute[];
  /**
   * Override the auto-derived active key (longest matching href against the
   * current pathname). `null` → force NO active tab (skip the pathname
   * fallback) for leaf routes that share a tab's href prefix.
   */
  activeKey?: string | null;
  variant?: NavTabsVariant;
  /** Stable identifier so multiple instances on a page don't share `layoutId`. */
  layoutId: string;
  ariaLabel: string;
  className?: string;
};

/**
 * `NavTabs` adapter that drives navigation via next-intl's locale-aware router.
 * Active tab is auto-derived from `usePathname()` unless `activeKey` is passed.
 */
export function NavTabsRouter({
  tabs,
  activeKey,
  variant,
  layoutId,
  ariaLabel,
  className,
}: NavTabsRouterProps) {
  const router = useRouter();
  const pathname = usePathname();

  // `undefined` → derive from pathname; an explicit key or `null` (no active
  // tab) is honoured as-is.
  const resolvedActiveKey =
    activeKey === undefined ? resolveActiveNavKey(tabs, pathname) : activeKey;

  return (
    <NavTabs
      tabs={tabs}
      activeKey={resolvedActiveKey}
      onChange={(key) => {
        const tab = tabs.find((t) => t.key === key);
        if (tab) router.push(tab.href);
      }}
      variant={variant}
      layoutId={layoutId}
      ariaLabel={ariaLabel}
      className={className}
    />
  );
}
