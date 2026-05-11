'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpenIcon,
  ChevronDownIcon,
  FileTextIcon,
  MenuIcon,
  PlayCircleIcon,
  SparklesIcon,
  XIcon,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useId, useState } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { Placeholder } from '@/shared/ui/placeholder';
import { cn } from '@/shared/lib/utils';
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
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';

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
type MobileFooterColumn = { items: string[] };

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const megaMenuItems = t.raw('megaMenu.items') as MegaMenuItem[];
  const mobileFooterColumns = t.raw(
    'mobileFooter.columns',
  ) as MobileFooterColumn[];
  const isLight = tone === 'light';

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

  const closeMobile = () => setMobileOpen(false);

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
            showCloseButton={false}
            className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
          >
            <SheetTitle className="sr-only">{t('openMenu')}</SheetTitle>
            <MobileMenu
              brand={t('brand')}
              megaMenuItems={megaMenuItems}
              mobileFooterColumns={mobileFooterColumns}
              onNavigate={closeMobile}
              closeLabel={t('closeMenu')}
              logInLabel={t('logIn')}
              signUpLabel={t('signUp')}
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

type MobileMenuProps = {
  brand: string;
  megaMenuItems: MegaMenuItem[];
  mobileFooterColumns: MobileFooterColumn[];
  onNavigate: () => void;
  closeLabel: string;
  logInLabel: string;
  signUpLabel: string;
};

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const EASE_IN_QUAD = [0.4, 0, 1, 1] as const;

function MobileMenu({
  brand,
  megaMenuItems,
  mobileFooterColumns,
  onNavigate,
  closeLabel,
  logInLabel,
  signUpLabel,
}: MobileMenuProps) {
  const t = useTranslations('home.header');
  const reduceMotion = useReducedMotion();
  const [openKey, setOpenKey] = useState<NavKey | null>(null);

  const panelTransition: Transition = reduceMotion
    ? { duration: 0 }
    : {
        height: { duration: 0.34, ease: EASE_OUT_EXPO },
        opacity: { duration: 0.22, ease: EASE_OUT_EXPO },
      };

  const listVariants: Variants = {
    hidden: {
      transition: reduceMotion
        ? {}
        : { staggerChildren: 0.025, staggerDirection: -1 },
    },
    visible: {
      transition: reduceMotion
        ? {}
        : { staggerChildren: 0.045, delayChildren: 0.06 },
    },
  };

  const itemVariants: Variants = {
    hidden: reduceMotion
      ? { opacity: 1, y: 0 }
      : {
          opacity: 0,
          y: -4,
          transition: { duration: 0.16, ease: EASE_IN_QUAD },
        },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.26, ease: EASE_OUT_EXPO },
    },
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <Link href="/" onClick={onNavigate} aria-label={brand}>
          <BrandMark label={brand} size="md" />
        </Link>
        <SheetClose
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-10 -mr-2 text-muted-foreground hover:text-foreground"
              aria-label={closeLabel}
            />
          }
        >
          <XIcon className="size-5" />
        </SheetClose>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <nav className="flex flex-col px-2 py-3">
          {NAV_ITEMS.map((item) =>
            item.hasMenu ? (
              <MobileNavSection
                key={item.key}
                label={t(`nav.${item.key}`)}
                open={openKey === item.key}
                onToggle={() =>
                  setOpenKey((prev) => (prev === item.key ? null : item.key))
                }
                megaMenuItems={megaMenuItems}
                onNavigate={onNavigate}
                reduceMotion={!!reduceMotion}
                listVariants={listVariants}
                itemVariants={itemVariants}
                panelTransition={panelTransition}
              />
            ) : (
              <Link
                key={item.key}
                href="#"
                onClick={onNavigate}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold text-foreground',
                  'transition-colors hover:bg-muted',
                )}
              >
                {t(`nav.${item.key}`)}
              </Link>
            ),
          )}
        </nav>

        <Separator />

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-5">
          {mobileFooterColumns.map((col, ci) => (
            <ul key={ci} className="flex flex-col gap-3">
              {col.items.map((label) => (
                <li key={label}>
                  <a
                    href="#"
                    onClick={onNavigate}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <div
        className={cn(
          'flex shrink-0 flex-col gap-2 border-t border-border bg-background px-5 pt-4',
          'pb-[max(env(safe-area-inset-bottom),1rem)]',
        )}
      >
        <Button
          className="h-11 w-full rounded-lg bg-brand text-[15px] font-medium text-brand-foreground hover:bg-brand/90"
          render={<Link href="/register" onClick={onNavigate} />}
          nativeButton={false}
        >
          {signUpLabel}
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full rounded-lg text-[15px] font-medium"
          render={<Link href="/login" onClick={onNavigate} />}
          nativeButton={false}
        >
          {logInLabel}
        </Button>
      </div>
    </div>
  );
}

type MobileNavSectionProps = {
  label: string;
  open: boolean;
  onToggle: () => void;
  megaMenuItems: MegaMenuItem[];
  onNavigate: () => void;
  reduceMotion: boolean;
  listVariants: Variants;
  itemVariants: Variants;
  panelTransition: Transition;
};

function MobileNavSection({
  label,
  open,
  onToggle,
  megaMenuItems,
  onNavigate,
  reduceMotion,
  listVariants,
  itemVariants,
  panelTransition,
}: MobileNavSectionProps) {
  const panelId = useId();
  const triggerId = useId();

  return (
    <div>
      <button
        id={triggerId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-semibold text-foreground',
          'transition-colors outline-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
        )}
      >
        <span>{label}</span>
        <motion.span
          aria-hidden
          className="ml-2 flex shrink-0"
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.28, ease: EASE_OUT_EXPO }
          }
        >
          <ChevronDownIcon className="size-5 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.section
            key="panel"
            id={panelId}
            aria-labelledby={triggerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={panelTransition}
            style={{ overflow: 'hidden' }}
          >
            <motion.ul
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={listVariants}
              className="mt-2 mb-2 flex flex-col gap-1 rounded-xl border border-border bg-card/50 p-2"
            >
              {megaMenuItems.map((sub, i) => {
                const Icon = MEGA_MENU_ICONS[i] ?? BookOpenIcon;
                return (
                  <motion.li key={sub.title} variants={itemVariants}>
                    <Link
                      href="#"
                      onClick={onNavigate}
                      className="flex items-start gap-3 rounded-lg p-2 no-underline transition-colors hover:bg-muted hover:no-underline"
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                        <Icon className="size-[18px] text-brand" />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {sub.title}
                        </span>
                        <span className="text-xs leading-relaxed text-muted-foreground">
                          {sub.description}
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
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
          <Placeholder variant="brand" seed="site-header-featured" />
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
