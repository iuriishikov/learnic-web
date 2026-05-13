'use client';

import { useRouter, usePathname } from '@/shared/config/i18n/navigation';

import {
  NavTabs,
  type NavTab,
  type NavTabsVariant,
} from './nav-tabs';

export type NavTabRoute = NavTab & { href: string };

export type NavTabsRouterProps = {
  tabs: NavTabRoute[];
  /** Override the auto-derived active key (longest matching href against the current pathname). */
  activeKey?: string;
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

  const resolvedActiveKey = activeKey ?? findActiveTabKey(tabs, pathname);

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

function findActiveTabKey(
  tabs: NavTabRoute[],
  pathname: string,
): string | undefined {
  let bestKey: string | undefined;
  let bestLength = -1;
  for (const tab of tabs) {
    if (tab.href === pathname && tab.href.length > bestLength) {
      bestKey = tab.key;
      bestLength = tab.href.length;
      continue;
    }
    if (
      pathname.startsWith(`${tab.href}/`) &&
      tab.href.length > bestLength
    ) {
      bestKey = tab.key;
      bestLength = tab.href.length;
    }
  }
  return bestKey;
}
