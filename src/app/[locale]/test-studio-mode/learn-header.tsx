'use client';

import {
  BellIcon,
  GraduationCapIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { UserAvatar } from '@/features/auth';
import { cn } from '@/shared/lib/utils';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';

import { MOCK_USER } from './mock-user';

type NavKey = 'home' | 'myCourses' | 'catalog' | 'community';

const NAV_ITEMS: { key: NavKey }[] = [
  { key: 'home' },
  { key: 'myCourses' },
  { key: 'catalog' },
  { key: 'community' },
];

type LearnHeaderProps = {
  activeKey?: NavKey;
  onSwitchToTeach: () => void;
};

export function LearnHeader({
  activeKey = 'home',
  onSwitchToTeach,
}: LearnHeaderProps) {
  const t = useTranslations('test-studio-mode.learn');
  const tRoot = useTranslations('test-studio-mode');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-3 px-4 md:gap-6 md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:gap-10">
          <span className="shrink-0">
            <BrandMark label={tRoot('brand')} size="sm" />
          </span>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => {
              const active = item.key === activeKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(`nav.${item.key}`)}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-10 rounded-lg shadow-xs md:inline-flex"
            aria-label={t('search')}
          >
            <SearchIcon className="size-[18px]" />
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

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={t('menu.open')}
                  className="rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                />
              }
            >
              <UserAvatar user={MOCK_USER} size="lg" online />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuItem>
                <UserIcon className="size-4" />
                {t('menu.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SettingsIcon className="size-4" />
                {t('menu.settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSwitchToTeach}>
                <GraduationCapIcon className="size-4 text-brand" />
                <span className="font-semibold text-brand">
                  {t('menu.switchToTeach')}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOutIcon className="size-4" />
                {t('menu.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 lg:hidden"
                  aria-label={t('menu.open')}
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
                <BrandMark label={tRoot('brand')} size="md" />
              </div>
              <nav className="flex flex-col">
                {NAV_ITEMS.map((item) => {
                  const active = item.key === activeKey;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'rounded-lg px-2 py-3 text-left text-base font-medium transition-colors',
                        active
                          ? 'bg-muted text-foreground'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      {t(`nav.${item.key}`)}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-auto border-t border-border pt-6">
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start gap-3 rounded-lg border-brand/30 text-[15px] font-semibold text-brand hover:bg-brand/5 hover:text-brand"
                  onClick={() => {
                    setMobileOpen(false);
                    onSwitchToTeach();
                  }}
                >
                  <GraduationCapIcon className="size-4" />
                  {t('menu.switchToTeach')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
