'use client';

import { useTranslations } from 'next-intl';
import { ArrowRightIcon, ChevronDownIcon } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
  type Variants,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';

import {
  useLatestPublishedPosts,
  type BlogPostCardData,
} from '@/features/blog';
import { getPopularTagsAction } from '@/features/products';
import type { Tag } from '@/features/product-tags';
import { Link } from '@/shared/config/i18n/navigation';
import { Placeholder } from '@/shared/ui/placeholder';
import { cn } from '@/shared/lib/utils';
import { BrandMark, type BrandMarkTone } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import {
  MobileMenu,
  MobileMenuBody,
  MobileMenuContent,
  MobileMenuFooter,
  MobileMenuHeader,
  MobileMenuTrigger,
} from '@/shared/ui/mobile-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/shared/ui/navigation-menu';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';

type NavKey = 'products' | 'services' | 'blog' | 'about';

/**
 * Each nav item declares how it behaves:
 * - `find-note` — the "Каталог" trigger; its dropdown lists the
 *   top-10 popular tags (each linking to the marketplace pre-filtered by
 *   that tag) alongside the latest blog post.
 * - `link` — a plain link to an in-app route (e.g. pricing, blog, the team page).
 */
type NavItem =
  | { key: 'products'; kind: 'find-note' }
  | { key: 'services'; kind: 'link'; href: string }
  | { key: 'blog'; kind: 'link'; href: string }
  | { key: 'about'; kind: 'link'; href: string };

const NAV_ITEMS: NavItem[] = [
  { key: 'products', kind: 'find-note' },
  { key: 'services', kind: 'link', href: '/pricing' },
  { key: 'blog', kind: 'link', href: '/blog' },
  { key: 'about', kind: 'link', href: '/team' },
];

/** How many popular tags the "find note" menu surfaces (backend caps at 50). */
const FIND_NOTE_TAGS_LIMIT = 20;

/**
 * `localStorage` key remembering which blog post the visitor dismissed
 * from the "find note" menu ("Не интересно"). Stored by slug, so a newer
 * post (different slug) surfaces again.
 */
const FIND_NOTE_DISMISS_KEY = 'learnic.find-note.dismissed-post';

/** Same-tab notification that the dismissed-post key changed. */
const FIND_NOTE_DISMISS_EVENT = 'learnic:find-note-dismiss';

/** Skeleton chip widths while the popular tags load. */
const TAG_SKELETON_WIDTHS = [
  'w-20',
  'w-28',
  'w-16',
  'w-24',
  'w-32',
  'w-20',
  'w-24',
  'w-16',
  'w-28',
  'w-20',
  'w-24',
  'w-16',
] as const;

type MobileFooterColumn = { items: string[] };

/** Lifecycle of the lazily-fetched popular-tags request. */
type TagsStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * `solid` — the default floating pill (border + blurred background).
 * `transparent` — no chrome at the top of the page, so the header can sit on
 * any page background (tinted heroes, gradients, …); it overlays the page
 * instead of occupying flow, and the pill chrome fades back in on scroll.
 */
export type SiteHeaderVariant = 'solid' | 'transparent';

type SiteHeaderProps = {
  bordered?: boolean;
  sticky?: boolean;
  tone?: BrandMarkTone;
  variant?: SiteHeaderVariant;
};

function readDismissedPost(): string | null {
  try {
    return localStorage.getItem(FIND_NOTE_DISMISS_KEY);
  } catch {
    return null;
  }
}

function subscribeDismissedPost(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(FIND_NOTE_DISMISS_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(FIND_NOTE_DISMISS_EVENT, onChange);
  };
}

/**
 * Slug of the blog post the visitor dismissed from the "find note" menu
 * ("Не интересно"), plus a setter that persists it. Backed by
 * ``localStorage`` through ``useSyncExternalStore`` so the read is SSR-safe
 * (server snapshot is ``null``, no hydration mismatch) and a dismiss updates
 * every mounted header instance in the same tab.
 */
function useDismissedPost(): readonly [string | null, (slug: string) => void] {
  const slug = useSyncExternalStore(
    subscribeDismissedPost,
    readDismissedPost,
    () => null,
  );
  const dismiss = useCallback((next: string) => {
    try {
      localStorage.setItem(FIND_NOTE_DISMISS_KEY, next);
    } catch {
      // Private mode / disabled storage — non-fatal; just won't persist.
    }
    window.dispatchEvent(new Event(FIND_NOTE_DISMISS_EVENT));
  }, []);
  return [slug, dismiss] as const;
}

export function SiteHeader({
  bordered = true,
  sticky = true,
  tone = 'dark',
  variant = 'solid',
}: SiteHeaderProps = {}) {
  const t = useTranslations('home.header');
  const [mobileOpen, setMobileOpen] = useState(false);

  // The "Каталог" menu is data-driven (popular tags + the latest
  // blog post). Both loads are deferred until the menu is first opened
  // (hover / focus / mobile expand) and owned here, in the always-mounted
  // header — never inside the dropdown content, which unmounts on close
  // and would refetch every open.
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [tagsStatus, setTagsStatus] = useState<TagsStatus>('idle');
  const tagsRequested = useRef(false);
  const [armed, setArmed] = useState(false);
  // Re-rolled on every menu open (hover / focus); seeds the tags' tumble-in so
  // the fall looks different each time. Set from an event handler (`arm`), not
  // during render — Math.random isn't allowed in render.
  const [fallSeed, setFallSeed] = useState(0);

  const loadTags = useCallback(() => {
    if (tagsRequested.current) return;
    tagsRequested.current = true;
    setTagsStatus('loading');
    void getPopularTagsAction({ limit: FIND_NOTE_TAGS_LIMIT }).then((res) => {
      if (res.ok) {
        setTags(res.tags);
        setTagsStatus('ready');
      } else {
        setTags([]);
        setTagsStatus('error');
      }
    });
  }, []);

  // First interaction with the menu arms the data loads; every interaction
  // re-rolls the tumble-in seed so the fall differs on each open.
  const arm = useCallback(() => {
    setArmed(true);
    setFallSeed(Math.random());
    loadTags();
  }, [loadTags]);

  const blogQuery = useLatestPublishedPosts(1, { enabled: armed });
  const latestPost = blogQuery.data?.[0] ?? null;

  // Per-post dismissal ("Не интересно"), persisted across visits.
  const [dismissedSlug, dismissFeatured] = useDismissedPost();

  const featuredLoading = armed && blogQuery.isPending;
  const featuredPost =
    !blogQuery.isError && latestPost && latestPost.slug !== dismissedSlug
      ? latestPost
      : null;

  const transparent = variant === 'transparent';
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (transparent) setScrolled(y > 16);
  });
  useEffect(() => {
    // Pick up a non-top initial scroll position (e.g. reload mid-page).
    if (!transparent) return;
    const raf = requestAnimationFrame(() => setScrolled(scrollY.get() > 16));
    return () => cancelAnimationFrame(raf);
  }, [transparent, scrollY]);

  const showChrome = bordered && (!transparent || scrolled);

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

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={cn(
        'mx-auto w-full max-w-[1216px] px-4 md:px-6',
        sticky && 'sticky top-4 z-40 md:top-6',
        // Transparent headers overlay the page so its background (tinted
        // hero, gradient, …) runs up to the very top edge behind the nav.
        transparent && '-mb-16 md:-mb-[72px]',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center justify-between rounded-2xl border px-3 md:h-[72px] md:px-5',
          'transition-[background-color,border-color,box-shadow] duration-300',
          showChrome
            ? 'border-border bg-background/60 backdrop-blur-xl'
            : 'border-transparent',
        )}
      >
        <div className="flex items-center gap-2 md:gap-10">
          <Link
            href="/"
            aria-label={t('brand')}
            className="inline-flex items-center"
          >
            <BrandMark label={t('brand')} size="md" tone={tone} />
          </Link>

          <NavigationMenu className="hidden md:flex" align="start">
            <NavigationMenuList>
              {NAV_ITEMS.map((item) => {
                const label = t(`nav.${item.key}`);
                switch (item.kind) {
                  case 'find-note':
                    return (
                      <NavigationMenuItem key={item.key} value="find-note">
                        <NavigationMenuTrigger
                          onMouseEnter={arm}
                          onFocus={arm}
                          className={cn(
                            'h-9 gap-0 px-3 text-[15px] font-medium',
                            navTriggerToneClasses,
                          )}
                        >
                          {label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <FindNoteMenu
                            tags={tags}
                            tagsStatus={tagsStatus}
                            featuredPost={featuredPost}
                            featuredLoading={featuredLoading}
                            onDismiss={dismissFeatured}
                            seed={fallSeed}
                          />
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  case 'link':
                    return (
                      <NavigationMenuItem key={item.key}>
                        <NavigationMenuLink
                          render={<Link href={item.href} />}
                          className={cn(
                            'h-9 px-3 text-[15px] font-medium',
                            navLinkToneClasses,
                          )}
                        >
                          {label}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                }
              })}
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

        <MobileMenu open={mobileOpen} onOpenChange={setMobileOpen}>
          <MobileMenuTrigger
            aria-label={t('openMenu')}
            tone={isLight ? 'light' : 'default'}
            hideFrom="md"
          />
          <MobileMenuContent srTitle={t('openMenu')}>
            <SiteMobileMenuContent
              brand={t('brand')}
              mobileFooterColumns={mobileFooterColumns}
              popularTags={tags}
              tagsStatus={tagsStatus}
              featuredPost={featuredPost}
              featuredLoading={featuredLoading}
              onArm={arm}
              onDismiss={dismissFeatured}
              onNavigate={closeMobile}
              closeLabel={t('closeMenu')}
              logInLabel={t('logIn')}
              signUpLabel={t('signUp')}
            />
          </MobileMenuContent>
        </MobileMenu>
      </div>
    </header>
  );
}

type SiteMobileMenuContentProps = {
  brand: string;
  mobileFooterColumns: MobileFooterColumn[];
  popularTags: Tag[] | null;
  tagsStatus: TagsStatus;
  featuredPost: BlogPostCardData | null;
  featuredLoading: boolean;
  onArm: () => void;
  onDismiss: (slug: string) => void;
  onNavigate: () => void;
  closeLabel: string;
  logInLabel: string;
  signUpLabel: string;
};

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const EASE_IN_QUAD = [0.4, 0, 1, 1] as const;

function SiteMobileMenuContent({
  brand,
  mobileFooterColumns,
  popularTags,
  tagsStatus,
  featuredPost,
  featuredLoading,
  onArm,
  onDismiss,
  onNavigate,
  closeLabel,
  logInLabel,
  signUpLabel,
}: SiteMobileMenuContentProps) {
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

  const toggleKey = (key: NavKey) =>
    setOpenKey((prev) => (prev === key ? null : key));

  return (
    <>
      <MobileMenuHeader closeAriaLabel={closeLabel}>
        <Link
          href="/"
          onClick={onNavigate}
          aria-label={brand}
          className="inline-flex items-center"
        >
          <BrandMark label={brand} size="md" />
        </Link>
      </MobileMenuHeader>

      <MobileMenuBody>
        <nav className="flex flex-col px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const label = t(`nav.${item.key}`);
            switch (item.kind) {
              case 'find-note':
                return (
                  <MobileNavCollapsible
                    key={item.key}
                    label={label}
                    open={openKey === item.key}
                    onToggle={() => {
                      toggleKey(item.key);
                      onArm();
                    }}
                    reduceMotion={!!reduceMotion}
                    listVariants={listVariants}
                    panelTransition={panelTransition}
                  >
                    <MobileTagItems
                      tags={popularTags}
                      status={tagsStatus}
                      itemVariants={itemVariants}
                      onNavigate={onNavigate}
                    />
                    <MobileFeaturedPost
                      post={featuredPost}
                      loading={featuredLoading}
                      itemVariants={itemVariants}
                      onDismiss={onDismiss}
                      onNavigate={onNavigate}
                    />
                  </MobileNavCollapsible>
                );
              case 'link':
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold text-foreground',
                      'transition-colors hover:bg-muted',
                    )}
                  >
                    {label}
                  </Link>
                );
            }
          })}
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
      </MobileMenuBody>

      <MobileMenuFooter>
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
      </MobileMenuFooter>
    </>
  );
}

type MobileNavCollapsibleProps = {
  label: string;
  open: boolean;
  onToggle: () => void;
  reduceMotion: boolean;
  listVariants: Variants;
  panelTransition: Transition;
  children: React.ReactNode;
};

/**
 * The expand/collapse shell shared by every mobile nav section: a header
 * button with a rotating chevron and an animated, staggered list panel. The
 * panel body is provided as children so the same chrome backs both the
 * mega-menu sections and the popular-tags / featured-post list.
 */
function MobileNavCollapsible({
  label,
  open,
  onToggle,
  reduceMotion,
  listVariants,
  panelTransition,
  children,
}: MobileNavCollapsibleProps) {
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
              {children}
            </motion.ul>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

type MobileTagItemsProps = {
  tags: Tag[] | null;
  status: TagsStatus;
  itemVariants: Variants;
  onNavigate: () => void;
};

/** Popular-tag rows for the mobile "Каталог" section. */
function MobileTagItems({
  tags,
  status,
  itemVariants,
  onNavigate,
}: MobileTagItemsProps) {
  const t = useTranslations('home.header.findNote');

  if (status === 'idle' || status === 'loading') {
    return (
      <>
        {TAG_SKELETON_WIDTHS.slice(0, 6).map((w, i) => (
          <motion.li
            key={i}
            variants={itemVariants}
            aria-hidden
            className="px-2 py-1.5"
          >
            <Skeleton className={cn('h-5 rounded-full', w)} />
          </motion.li>
        ))}
      </>
    );
  }

  if (!tags || tags.length === 0) {
    return (
      <motion.li
        variants={itemVariants}
        className="px-2 py-1.5 text-sm text-muted-foreground"
      >
        {t('empty')}
      </motion.li>
    );
  }

  return (
    <>
      {tags.map((tag) => (
        <motion.li key={tag.id} variants={itemVariants}>
          <Link
            href={`/marketplace?tags=${tag.id}`}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-muted hover:no-underline"
          >
            <TagSwatch color={tag.color} />
            <span className="truncate">{tag.name}</span>
          </Link>
        </motion.li>
      ))}
      <motion.li variants={itemVariants}>
        <Link
          href="/marketplace"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-brand no-underline transition-colors hover:bg-muted hover:no-underline"
        >
          <span>{t('viewAll')}</span>
          <ArrowRightIcon className="size-4" />
        </Link>
      </motion.li>
    </>
  );
}

type MobileFeaturedPostProps = {
  post: BlogPostCardData | null;
  loading: boolean;
  itemVariants: Variants;
  onDismiss: (slug: string) => void;
  onNavigate: () => void;
};

/** Latest blog post, stacked under the tags in the mobile section. */
function MobileFeaturedPost({
  post,
  loading,
  itemVariants,
  onDismiss,
  onNavigate,
}: MobileFeaturedPostProps) {
  const t = useTranslations('home.header.findNote');

  if (loading) {
    return (
      <motion.li variants={itemVariants} className="mt-1 px-1" aria-hidden>
        <Skeleton className="aspect-[16/9] w-full rounded-md" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </motion.li>
    );
  }

  if (!post) return null;

  return (
    <motion.li variants={itemVariants} className="mt-1">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-background p-2">
        <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-muted">
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL, short-lived; matches BlogPostCard
            <img src={post.coverUrl} alt="" className="size-full object-cover" />
          ) : (
            <Placeholder variant="brand" seed={post.slug} />
          )}
        </div>
        <p className="line-clamp-2 px-0.5 text-sm font-semibold text-foreground">
          {post.title}
        </p>
        {post.excerpt ? (
          <p className="line-clamp-2 px-0.5 text-xs leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
        <div className="mt-0.5 flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            render={<Link href={`/blog/${post.slug}`} onClick={onNavigate} />}
            nativeButton={false}
          >
            {t('readMore')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-muted-foreground"
            onClick={() => onDismiss(post.slug)}
          >
            {t('notInterested')}
          </Button>
        </div>
      </div>
    </motion.li>
  );
}

type FindNoteMenuProps = {
  tags: Tag[] | null;
  tagsStatus: TagsStatus;
  featuredPost: BlogPostCardData | null;
  featuredLoading: boolean;
  onDismiss: (slug: string) => void;
  /** Fresh random value per menu open; seeds the per-card tumble-in. */
  seed: number;
};

/** One tag's randomised tumble-in parameters (rolled once per menu open). */
type FallConfig = {
  y: number;
  x: number;
  rotate: number;
  delay: number;
  yBounce: number;
  yDur: number;
  xBounce: number;
  xDur: number;
  rotBounce: number;
  rotDur: number;
};

/**
 * Leading marker for a tag — a hashtag glyph tinted in the tag's own colour
 * on a faint same-colour wash. Shared by the desktop dropdown cards and the
 * mobile rows so the "find note" tags read consistently.
 */
function TagSwatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      className="grid size-5 shrink-0 place-items-center rounded-md text-[11px] font-bold leading-none"
      style={{
        color,
        backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
      }}
    >
      #
    </span>
  );
}

/**
 * Desktop dropdown for "Каталог", laid out like the mega menu:
 * popular-tag chips on the left (each links to the marketplace pre-filtered
 * by that tag) and the latest blog post on the right with "read more" /
 * "not interested" actions. Collapses to a single tags column when there's
 * no post to feature (none published, dismissed, or failed to load).
 */
function FindNoteMenu({
  tags,
  tagsStatus,
  featuredPost,
  featuredLoading,
  onDismiss,
  seed,
}: FindNoteMenuProps) {
  const t = useTranslations('home.header.findNote');
  const reduceMotion = useReducedMotion();
  const tagsLoading = tagsStatus === 'idle' || tagsStatus === 'loading';
  const hasTags = !!tags && tags.length > 0;
  const showFeatured = featuredLoading || !!featuredPost;

  // "Falling blocks": every tag really tumbles in and lands. Each card gets its
  // OWN start (height, sideways drift, spin) and lands on a BOUNCY per-axis
  // spring (it overshoots its slot and settles), so cards drop and stand into
  // place rather than being lowered smoothly "on a string". The delay is random
  // (0–0.5s) so the order and timing differ. All values come from a pure hash
  // of `seed` (rolled fresh in the parent every time the menu opens, so the
  // fall is different each open) and the card index — pure during render, and
  // stable across the re-renders within one open. Honors reduced motion.
  const hash = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n); // [0, 1)
  };
  const fallConfigs: FallConfig[] = (tags ?? []).map((_, i) => {
    const h = (k: number) => hash(seed * 101.7 + k * 7.3, i + 1);
    return {
      y: -70 - h(1) * 120, // start −70…−190px up
      x: (h(2) * 2 - 1) * 60, // sideways drift ±60px
      rotate: (h(3) * 2 - 1) * 210, // tumble/flip (can pass 180°)
      delay: h(4) * 0.5, // random order + timing every open
      yBounce: 0.45 + h(5) * 0.25, // bouncy landing per axis…
      yDur: 0.55 + h(6) * 0.4,
      xBounce: 0.2 + h(7) * 0.25,
      xDur: 0.5 + h(8) * 0.3,
      rotBounce: 0.3 + h(9) * 0.25,
      rotDur: 0.6 + h(10) * 0.4,
    };
  });
  // Per-card fall for tag index `i`.
  const fallIn = (i: number) => {
    const c = fallConfigs[i];
    if (reduceMotion || !c) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.15, delay: i * 0.02 },
      };
    }
    return {
      initial: { opacity: 0, y: c.y, x: c.x, rotate: c.rotate },
      animate: { opacity: 1, y: 0, x: 0, rotate: 0 },
      transition: {
        // Each axis lands on its own bouncy spring (overshoots, then settles)
        // and they finish at slightly different times, so nothing reads as a
        // single string pulling the card into place. opacity fades fast so the
        // spun-up start never flashes legibly.
        opacity: { duration: 0.16, delay: c.delay },
        y: { type: 'spring', bounce: c.yBounce, duration: c.yDur, delay: c.delay },
        x: { type: 'spring', bounce: c.xBounce, duration: c.xDur, delay: c.delay },
        rotate: {
          type: 'spring',
          bounce: c.rotBounce,
          duration: c.rotDur,
          delay: c.delay,
        },
      },
    };
  };

  const tagsColumn = (
    <div className="flex flex-col gap-3 p-1">
      {tagsLoading ? (
        <ul className="flex flex-wrap gap-2" aria-hidden>
          {TAG_SKELETON_WIDTHS.map((w, i) => (
            <li key={i}>
              <Skeleton className={cn('h-9 rounded-xl', w)} />
            </li>
          ))}
        </ul>
      ) : hasTags ? (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <motion.li
              key={tag.id}
              {...fallIn(i)}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      y: -2,
                      transition: { type: 'spring', stiffness: 400, damping: 26 },
                    }
              }
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            >
              <NavigationMenuLink
                render={<Link href={`/marketplace?tags=${tag.id}`} />}
                style={{ '--tag': tag.color } as CSSProperties}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-medium text-foreground shadow-sm',
                  'transition-[background-color,border-color,box-shadow]',
                  'border-[color:color-mix(in_oklab,var(--tag)_22%,transparent)]',
                  'bg-[color-mix(in_oklab,var(--tag)_10%,transparent)]',
                  'hover:border-[color:color-mix(in_oklab,var(--tag)_55%,transparent)]',
                  'hover:bg-[color-mix(in_oklab,var(--tag)_18%,transparent)]',
                  'hover:shadow-md',
                )}
              >
                <TagSwatch color={tag.color} />
                <span className="truncate">{tag.name}</span>
              </NavigationMenuLink>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="px-1 text-sm text-muted-foreground">{t('empty')}</p>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-1">
        <Separator />
        <NavigationMenuLink
          render={<Link href="/marketplace" />}
          className="group/all justify-between gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand"
        >
          <span>{t('viewAll')}</span>
          <span className="flex size-6 items-center justify-center rounded-md bg-brand/10 text-brand transition-transform duration-200 group-hover/all:translate-x-0.5">
            <ArrowRightIcon className="size-4" aria-hidden />
          </span>
        </NavigationMenuLink>
      </div>
    </div>
  );

  if (!showFeatured) {
    return <div className="flex w-[420px] flex-col p-2">{tagsColumn}</div>;
  }

  return (
    <div className="grid w-[700px] grid-cols-[1fr_300px] gap-2 p-2">
      {tagsColumn}
      {featuredLoading ? (
        <FeaturedPostSkeleton />
      ) : featuredPost ? (
        <FeaturedPostCard post={featuredPost} onDismiss={onDismiss} />
      ) : null}
    </div>
  );
}

function FeaturedPostCard({
  post,
  onDismiss,
}: {
  post: BlogPostCardData;
  onDismiss: (slug: string) => void;
}) {
  const t = useTranslations('home.header.findNote');

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted">
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL, short-lived; matches BlogPostCard
          <img src={post.coverUrl} alt="" className="size-full object-cover" />
        ) : (
          <Placeholder variant="brand" seed={post.slug} />
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">
          {post.title}
        </p>
        {post.excerpt ? (
          <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
      </div>

      <div className="mt-auto flex items-center gap-4 text-xs font-medium">
        <button
          type="button"
          onClick={() => onDismiss(post.slug)}
          className="rounded-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {t('notInterested')}
        </button>
        <Link
          href={`/blog/${post.slug}`}
          className="rounded-sm text-brand outline-none transition-colors hover:text-brand/80 focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {t('readMore')}
        </Link>
      </div>
    </div>
  );
}

function FeaturedPostSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3" aria-hidden>
      <Skeleton className="aspect-[16/10] w-full rounded-md" />
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="mt-auto flex items-center gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
