'use client';

import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';

type TabKey = 'lessons' | 'assignments' | 'students' | 'discussions' | 'settings';

const TABS: { key: TabKey; badge?: number }[] = [
  { key: 'lessons' },
  { key: 'assignments', badge: 3 },
  { key: 'students' },
  { key: 'discussions', badge: 12 },
  { key: 'settings' },
];

export function StudioSubHeader() {
  const t = useTranslations('test-studio-mode.teach.subHeader');
  const [active, setActive] = useState<TabKey>('lessons');

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.6 }}
      >
        <div className="sticky top-[73px] z-30 border-b border-border bg-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
            <div className="flex items-center gap-2 pt-3 text-xs font-semibold tracking-tight text-muted-foreground">
              <span>{t('courseLabel')}</span>
            </div>
            <nav
              aria-label={t('ariaLabel')}
              className="-mx-4 flex items-center gap-6 overflow-x-auto px-4 [scrollbar-width:none] md:-mx-8 md:gap-7 md:px-8 [&::-webkit-scrollbar]:hidden"
            >
              {TABS.map((tab) => {
                const isActive = tab.key === active;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActive(tab.key)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative inline-flex shrink-0 items-center gap-2 py-3 text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-150',
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
                      <span>{t(`tabs.${tab.key}`)}</span>
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
                        layoutId="studio-sub-header-underline"
                        aria-hidden
                        className="pointer-events-none absolute -bottom-px right-0 left-0 h-[2px] rounded-full bg-brand"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 38,
                          mass: 0.55,
                        }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
