'use client';

import { MenuIcon, SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { useAuth } from '@/features/auth';
import { NotificationsBell } from '@/features/notifications';
import { Link, usePathname } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import { NavTabsRouter, type NavTabRoute } from '@/shared/ui/nav-tabs-router';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';
import { UserAvatar } from '@/shared/ui/user-avatar';

import { BrandSuffix } from './brand-suffix';
import { UserMenu } from './user-menu';

export type AppHeaderNavItem = {
  key: string;
  href: string;
  label: string;
};

export type AppHeaderProps = {
  /** Primary navigation items rendered in the centre of the header (and inside the mobile sheet). */
  navItems?: AppHeaderNavItem[];
  /** Active item key. When omitted, falls back to pathname-based matching. */
  activeKey?: string;
  /** Slot rendered before the bell on desktop and at the top of the mobile sheet. */
  actions?: ReactNode;
  /** Slot rendered at the bottom of the mobile sheet (use for mode switches, secondary CTAs). */
  mobileActions?: ReactNode;
  /** Optional element rendered immediately after the brand mark — e.g. a "Studio" badge. */
  brandSuffix?: ReactNode;
  /** Where the brand mark links to. Defaults to `/`. */
  brandHref?: string;
};

export function AppHeader({
  navItems = [],
  activeKey,
  actions,
  mobileActions,
  brandSuffix,
  brandHref = '/',
}: AppHeaderProps = {}) {
  const t = useTranslations('app-header');
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const resolvedActiveKey =
    activeKey ?? findLongestMatchKey(navItems, pathname);

  function isActive(item: AppHeaderNavItem): boolean {
    return resolvedActiveKey === item.key;
  }

  const isSettingsActive =
    pathname === '/settings' || pathname.startsWith('/settings/');

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:gap-6 md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:gap-8">
          <Link
            href={brandHref}
            aria-label={t('brand')}
            className="flex shrink-0 items-center"
          >
            <BrandMark label={t('brand')} size="sm" />
            <BrandSuffix>{brandSuffix}</BrandSuffix>
          </Link>
          {navItems.length > 0 ? (
            <NavTabsRouter
              tabs={navItems satisfies NavTabRoute[]}
              activeKey={resolvedActiveKey}
              variant="pill"
              layoutId="app-header-nav"
              ariaLabel={t('navAriaLabel')}
              className="hidden lg:flex"
            />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {actions ? (
            <div className="hidden items-center gap-2 md:flex">{actions}</div>
          ) : null}
          <Button
            variant="outline"
            size="icon"
            className={cn(
              'hidden size-10 rounded-lg shadow-xs transition-shadow duration-150 ease-out md:inline-flex',
              'focus-visible:border-transparent focus-visible:ring-brand/40 data-[popup-open]:border-transparent data-[popup-open]:ring-brand/50 data-popup-open:border-transparent data-popup-open:ring-brand/50',
              isSettingsActive &&
                'bg-muted text-foreground dark:bg-input/50',
            )}
            aria-label={t('settings')}
            aria-current={isSettingsActive ? 'page' : undefined}
            render={<Link href="/settings" />}
            nativeButton={false}
          >
            <SettingsIcon className="size-[18px]" />
          </Button>
          <NotificationsBell />

          {user ? (
            <UserMenu user={user} />
          ) : (
            <UserAvatar user={null} size="lg" />
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 lg:hidden"
                  aria-label={t('openMenu')}
                />
              }
            >
              <MenuIcon className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[85vw] max-w-sm flex-col gap-0 p-6"
            >
              <div className="mb-2 flex items-center gap-2">
                <BrandMark label={t('brand')} size="md" />
              </div>
              <div className="mb-6">
                <BrandSuffix variant="block">{brandSuffix}</BrandSuffix>
              </div>
              {actions ? (
                <div className="mb-6 flex flex-col gap-2">{actions}</div>
              ) : null}
              {navItems.length > 0 ? (
                <nav className="flex flex-col">
                  {navItems.map((item) => {
                    const active = isActive(item);
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'rounded-lg px-2 py-3 text-base font-medium transition-colors',
                          active
                            ? 'bg-muted text-foreground'
                            : 'text-foreground hover:bg-muted',
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    'h-11 w-full justify-center gap-2 rounded-lg text-[15px] font-medium',
                    isSettingsActive &&
                      'bg-muted text-foreground dark:bg-input/50',
                  )}
                  aria-current={isSettingsActive ? 'page' : undefined}
                  render={
                    <Link
                      href="/settings"
                      onClick={() => setMobileOpen(false)}
                    />
                  }
                  nativeButton={false}
                >
                  <SettingsIcon className="size-4" />
                  {t('settings')}
                </Button>
              </div>
              {mobileActions ? (
                <div className="mt-auto border-t border-border pt-6">
                  {mobileActions}
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function findLongestMatchKey(
  items: AppHeaderNavItem[],
  pathname: string,
): string | undefined {
  let bestKey: string | undefined;
  let bestLength = -1;
  for (const item of items) {
    if (item.href === '/') {
      if (pathname === '/' && bestLength < 1) {
        bestKey = item.key;
        bestLength = 1;
      }
      continue;
    }
    const matches =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (matches && item.href.length > bestLength) {
      bestKey = item.key;
      bestLength = item.href.length;
    }
  }
  return bestKey;
}

