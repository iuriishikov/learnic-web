'use client';

import { BellIcon, MenuIcon, SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { UserAvatar, useAuth, type User } from '@/features/auth';
import { usePresence } from '@/features/presence';
import { Link, usePathname } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';

type NavKey = 'home' | 'dashboard' | 'products' | 'tasks' | 'reporting' | 'users';

const NAV_ITEMS: { key: NavKey; href: string }[] = [
  { key: 'home', href: '/' },
  { key: 'dashboard', href: '/dashboard' },
  { key: 'products', href: '/products' },
  { key: 'tasks', href: '/tasks' },
  { key: 'reporting', href: '/reporting' },
  { key: 'users', href: '/users' },
];

type AppHeaderProps = {
  activeNavKey?: NavKey;
};

export function AppHeader({ activeNavKey }: AppHeaderProps = {}) {
  const t = useTranslations('app-header');
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    if (activeNavKey) return activeNavKey === item.key;
    if (item.href === '/') return pathname === '/';
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:gap-6 md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:gap-10">
          <Link href="/" aria-label={t('brand')} className="shrink-0">
            <BrandMark label={t('brand')} size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`nav.${item.key}`)}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-10 rounded-lg shadow-xs md:inline-flex"
            aria-label={t('settings')}
          >
            <SettingsIcon className="size-[18px]" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="relative size-10 rounded-lg shadow-xs"
            aria-label={t('notifications')}
          >
            <BellIcon className="size-[18px]" />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1.5 -right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-semibold leading-none text-white"
            >
              2
            </span>
          </Button>

          {user ? (
            <UserAvatarLink user={user} />
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
              <div className="mb-8">
                <BrandMark label={t('brand')} size="md" />
              </div>
              <nav className="flex flex-col">
                {NAV_ITEMS.map((item) => {
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
                      {t(`nav.${item.key}`)}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="h-11 w-full justify-center gap-2 rounded-lg text-[15px] font-medium"
                >
                  <SettingsIcon className="size-4" />
                  {t('settings')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function UserAvatarLink({ user }: { user: User }) {
  const t = useTranslations('app-header');
  const presence = usePresence(user.oid);
  const isOnline = presence === 'online';

  return (
    <Link
      href={`/users/${user.oid}`}
      aria-label={t('userAvatar')}
      className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <UserAvatar user={user} size="lg" online={isOnline} />
    </Link>
  );
}
