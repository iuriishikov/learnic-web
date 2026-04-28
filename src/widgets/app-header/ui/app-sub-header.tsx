'use client';

import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useReducedMotion,
} from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Link, usePathname } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';

import {
  SUB_HEADER_SECTIONS,
  findActiveSubHeaderTab,
  findSubHeaderSection,
  type SubHeaderSection,
  type SubHeaderTab,
} from './sub-header-sections';

type AppSubHeaderProps = {
  className?: string;
  /** Force a specific section regardless of pathname. */
  sectionKey?: string;
  /** Force the active tab href (used together with sectionKey for previews). */
  activeHref?: string;
};

export function AppSubHeader({
  className,
  sectionKey,
  activeHref,
}: AppSubHeaderProps = {}) {
  const t = useTranslations('app-header.subHeader');
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const section = useMemo<SubHeaderSection | undefined>(() => {
    if (sectionKey) {
      return SUB_HEADER_SECTIONS.find((s) => s.key === sectionKey);
    }
    return findSubHeaderSection(pathname);
  }, [pathname, sectionKey]);

  const activeTab = useMemo<SubHeaderTab | undefined>(() => {
    if (!section) return undefined;
    if (activeHref) {
      return (
        section.tabs.find((tab) => tab.href === activeHref) ?? section.tabs[0]
      );
    }
    return findActiveSubHeaderTab(section, pathname);
  }, [section, pathname, activeHref]);

  const swapDuration = prefersReducedMotion ? 0 : 0.22;
  const swapEase: [number, number, number, number] = [0.32, 0.72, 0, 1];

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.6 }}
      >
        <m.div
          aria-hidden={!section}
          initial={false}
          animate={{
            height: section ? 'auto' : 0,
            opacity: section ? 1 : 0,
          }}
          transition={{ duration: swapDuration, ease: swapEase }}
          className={cn(
            'sticky top-[73px] z-30 overflow-hidden bg-background',
            className,
          )}
        >
          <div
            className={cn(
              'transition-colors duration-200',
              section ? 'border-b border-border' : 'border-b-0',
            )}
          >
            <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
              <AnimatePresence mode="popLayout" initial={false}>
                {section ? (
                  <m.div
                    key={section.key}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: swapDuration, ease: swapEase }}
                  >
                    <SectionTabs
                      section={section}
                      activeKey={activeTab?.key}
                      ariaLabel={t(`sections.${section.key}.label`)}
                      label={(key) =>
                        t(`sections.${section.key}.tabs.${key}`)
                      }
                    />
                  </m.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}

type SectionTabsProps = {
  section: SubHeaderSection;
  activeKey: string | undefined;
  ariaLabel: string;
  label: (key: string) => string;
};

function SectionTabs({
  section,
  activeKey,
  ariaLabel,
  label,
}: SectionTabsProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="-mx-4 flex items-center gap-6 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-8 md:gap-7 md:px-8 [&::-webkit-scrollbar]:hidden"
    >
      {section.tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group relative inline-flex shrink-0 items-center gap-2 py-3.5 text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-150',
              'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/40',
              isActive
                ? 'text-brand'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <m.span
              whileHover={isActive ? undefined : { y: -1 }}
              whileTap={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="inline-flex items-center gap-2"
            >
              <span>{label(tab.key)}</span>
              {tab.badge !== undefined ? (
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border px-1.5 text-[11px] font-semibold leading-none transition-colors duration-200',
                    isActive
                      ? 'border-brand/25 bg-brand/10 text-brand'
                      : 'border-border bg-muted text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {tab.badge}
                </span>
              ) : null}
            </m.span>
            {isActive ? (
              <m.span
                layoutId={`app-sub-header-underline-${section.key}`}
                aria-hidden
                className="pointer-events-none absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-brand"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 38,
                  mass: 0.55,
                }}
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
