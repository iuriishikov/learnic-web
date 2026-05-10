'use client';

import { ChevronRightIcon, HouseIcon } from 'lucide-react';
import {
  AnimatePresence,
  LazyMotion,
  domMax,
  m,
  useReducedMotion,
} from 'motion/react';
import { useTranslations } from 'next-intl';
import { Fragment } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';

import type { BreadcrumbSegment } from './breadcrumb-config-provider';

export type AppBreadcrumbsProps = {
  segments: BreadcrumbSegment[];
  className?: string;
};

export function AppBreadcrumbs({ segments, className }: AppBreadcrumbsProps) {
  const t = useTranslations('app-header.breadcrumbs');
  const prefersReducedMotion = useReducedMotion();
  const swapDuration = prefersReducedMotion ? 0 : 0.22;
  const swapEase: [number, number, number, number] = [0.32, 0.72, 0, 1];

  if (segments.length < 2) return null;

  return (
    <LazyMotion features={domMax} strict>
      <div className={className}>
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-8">
          <AnimatePresence mode="wait" initial={false}>
            <m.nav
              key={segments.map((s) => s.label).join('|')}
              aria-label={t('ariaLabel')}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: swapDuration, ease: swapEase }}
              className="flex min-w-0 items-center gap-1.5 py-2.5 text-sm"
            >
              <Link
                href="/"
                aria-label={t('home')}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <HouseIcon className="size-4" />
              </Link>
              {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                return (
                  <Fragment key={`${segment.label}-${index}`}>
                    <ChevronRightIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground/60"
                    />
                    {isLast || !segment.href ? (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        title={segment.label}
                        className={cn(
                          'flex h-7 items-center rounded-md px-2 text-sm font-semibold',
                          isLast
                            ? 'min-w-0 bg-muted text-foreground'
                            : 'shrink-0 text-muted-foreground',
                        )}
                      >
                        <span className="truncate">{segment.label}</span>
                      </span>
                    ) : (
                      <Link
                        href={segment.href}
                        title={segment.label}
                        className="flex h-7 shrink-0 items-center rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <span className="truncate">{segment.label}</span>
                      </Link>
                    )}
                  </Fragment>
                );
              })}
            </m.nav>
          </AnimatePresence>
        </div>
      </div>
    </LazyMotion>
  );
}
