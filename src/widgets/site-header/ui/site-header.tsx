'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpenIcon,
  ChevronDownIcon,
  FileTextIcon,
  LogOutIcon,
  MenuIcon,
  PlayCircleIcon,
  SparklesIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useState, useTransition } from 'react';

import { useAuth } from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';
import { PLACEHOLDERS } from '@/shared/lib/placeholders';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { BrandMark, type BrandMarkTone } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/shared/ui/sheet';

import { UserMenu } from './user-menu';

type NavKey = 'products' | 'services' | 'pricing' | 'resources' | 'about';

const NAV_ITEMS: { key: NavKey; hasMenu: boolean }[] = [
  { key: 'products', hasMenu: true },
  { key: 'services', hasMenu: true },
  { key: 'pricing', hasMenu: false },
  { key: 'resources', hasMenu: true },
  { key: 'about', hasMenu: false },
];

const MEGA_MENU_ICONS = [BookOpenIcon, SparklesIcon, PlayCircleIcon, FileTextIcon];

type MegaMenuItem = { title: string; description: string };

type SiteHeaderProps = {
  bordered?: boolean;
  sticky?: boolean;
  tone?: BrandMarkTone;
};

export function SiteHeader({
  bordered = true,
  sticky = true,
  tone = 'dark',
}: SiteHeaderProps = {}) {
  const t = useTranslations('home.header');
  const tUser = useTranslations('home.header.userMenu');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const [isLoggingOut, startLogoutTransition] = useTransition();

  const megaMenuItems = t.raw('megaMenu.items') as MegaMenuItem[];
  const isLight = tone === 'light';

  function handleMobileLogout() {
    startLogoutTransition(async () => {
      await logout();
      setMobileOpen(false);
    });
  }

  const navTriggerToneClasses = isLight
    ? 'text-brand-foreground/70 hover:text-brand-foreground data-open:text-brand-foreground data-popup-open:text-brand-foreground'
    : 'text-muted-foreground hover:text-foreground data-open:text-foreground data-popup-open:text-foreground';

  const navLinkToneClasses = isLight
    ? 'text-brand-foreground/70 hover:text-brand-foreground'
    : 'text-muted-foreground hover:text-foreground';

  const signUpToneClasses = isLight
    ? 'bg-brand-foreground text-brand hover:bg-brand-foreground/90'
    : 'bg-brand text-brand-foreground hover:bg-brand/90';

  const logInToneClasses = isLight
    ? 'border-brand-foreground/40 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground'
    : '';

  const mobileTriggerToneClasses = isLight
    ? 'text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground'
    : '';

  return (
    <header
      className={cn(
        'mx-auto w-full max-w-[1216px] px-4 md:px-6',
        sticky && 'sticky top-4 z-40 md:top-6',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center justify-between rounded-2xl px-3 md:h-[72px] md:px-5',
          bordered && 'border border-border bg-background/90 backdrop-blur',
        )}
      >
        <div className="flex items-center gap-2 md:gap-10">
          <Link href="/" aria-label={t('brand')}>
            <BrandMark label={t('brand')} size="md" tone={tone} />
          </Link>

          <NavigationMenu className="hidden md:flex" align="start">
            <NavigationMenuList>
              {NAV_ITEMS.map((item) =>
                item.hasMenu ? (
                  <NavigationMenuItem key={item.key}>
                    <NavigationMenuTrigger
                      className={cn(
                        'h-9 gap-0 px-3 text-[15px] font-medium',
                        navTriggerToneClasses,
                      )}
                    >
                      {t(`nav.${item.key}`)}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <MegaMenu items={megaMenuItems} />
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={item.key}>
                    <NavigationMenuLink
                      href="#"
                      className={cn(
                        'h-9 px-3 text-[15px] font-medium',
                        navLinkToneClasses,
                      )}
                    >
                      {t(`nav.${item.key}`)}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserMenu user={user} tone={tone === 'light' ? 'light' : 'dark'} />
          ) : (
            <>
              <Button
                variant="outline"
                className={cn(
                  'h-10 rounded-lg px-4 text-[15px] font-medium',
                  logInToneClasses,
                )}
                render={<Link href="/login" />}
                nativeButton={false}
              >
                {t('logIn')}
              </Button>
              <Button
                className={cn(
                  'h-10 rounded-lg px-4 text-[15px] font-medium',
                  signUpToneClasses,
                )}
                render={<Link href="/register" />}
                nativeButton={false}
              >
                {t('signUp')}
              </Button>
            </>
          )}
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className={cn('size-10 md:hidden', mobileTriggerToneClasses)}
                aria-label={t('openMenu')}
              />
            }
          >
            <MenuIcon className="size-6" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-[85vw] max-w-sm flex-col gap-0 p-6"
          >
            <div className="mb-8">
              <BrandMark label={t('brand')} size="md" />
            </div>
            <nav className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.key}
                  href="#"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2 py-3 text-base font-medium text-foreground',
                    'hover:bg-muted',
                  )}
                >
                  {t(`nav.${item.key}`)}
                  {item.hasMenu && (
                    <ChevronDownIcon className="size-4 text-muted-foreground" />
                  )}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              {user ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <Avatar className="size-10">
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback>
                        {`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[15px] font-semibold text-foreground">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                      </span>
                      {user.description ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {user.description}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-center gap-2 rounded-lg text-[15px] font-medium text-destructive hover:text-destructive"
                    onClick={handleMobileLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOutIcon className="size-4" />
                    {isLoggingOut ? tUser('loggingOut') : tUser('logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-lg text-[15px] font-medium"
                    render={
                      <Link href="/login" onClick={() => setMobileOpen(false)} />
                    }
                    nativeButton={false}
                  >
                    {t('logIn')}
                  </Button>
                  <Button
                    className="h-11 w-full rounded-lg bg-brand text-[15px] font-medium text-brand-foreground hover:bg-brand/90"
                    render={
                      <Link href="/register" onClick={() => setMobileOpen(false)} />
                    }
                    nativeButton={false}
                  >
                    {t('signUp')}
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function MegaMenu({ items }: { items: MegaMenuItem[] }) {
  const t = useTranslations('home.header.megaMenu');

  return (
    <div className="grid w-[680px] grid-cols-[1fr_260px] gap-2 p-2">
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const Icon = MEGA_MENU_ICONS[i] ?? BookOpenIcon;
          return (
            <li key={item.title}>
              <NavigationMenuLink
                href="#"
                className="items-start gap-3 p-3"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                  <Icon className="size-[18px] text-brand" />
                </span>
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </span>
                </span>
              </NavigationMenuLink>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded-md">
          <Image
            src={PLACEHOLDERS.dreamyBlur}
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">
            {t('featured.title')}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t('featured.description')}
          </p>
        </div>
        <div className="mt-auto flex items-center gap-4 text-xs font-medium">
          <a
            href="#"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('featured.dismiss')}
          </a>
          <a
            href="#"
            className="text-brand transition-colors hover:text-brand/80"
          >
            {t('featured.cta')}
          </a>
        </div>
      </div>
    </div>
  );
}
