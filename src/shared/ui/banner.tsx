'use client';

import { BadgeCheckIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

export type BannerVariant = 'brand' | 'plain';
export type BannerLayout = 'auto' | 'card' | 'bar';
export type BannerPosition =
  | 'bottom'
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right';

export type BannerAction = {
  label: ReactNode;
  onClick: () => void;
};

export type BannerProps = {
  id: string;
  priority?: number;
  variant?: BannerVariant;
  layout?: BannerLayout;
  position?: BannerPosition;
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  primaryAction?: BannerAction;
  secondaryAction?: BannerAction;
  dismissable?: boolean;
  closeLabel?: string;
  onDismiss?: () => void;
  className?: string;
};

type BannerEntry = {
  id: string;
  priority: number;
  element: ReactNode;
};

/* ---------- module-level queue store ---------- */

const entriesMap = new Map<string, BannerEntry>();
const listeners = new Set<() => void>();

const EMPTY: ReadonlyArray<BannerEntry> = [];
let snapshot: ReadonlyArray<BannerEntry> = EMPTY;

function recompute() {
  snapshot = Array.from(entriesMap.values()).sort(
    (a, b) => b.priority - a.priority,
  );
}

function notify() {
  listeners.forEach((l) => l());
}

function upsertEntry(entry: BannerEntry) {
  entriesMap.set(entry.id, entry);
  recompute();
  notify();
}

function removeEntry(id: string) {
  if (!entriesMap.delete(id)) return;
  recompute();
  notify();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot(): ReadonlyArray<BannerEntry> {
  return EMPTY;
}

/* ---------- public API ---------- */

export function BannerProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <BannerHost />
    </>
  );
}

function BannerHost() {
  const entries = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const active = entries[0];

  // `pointer-events-none` so the empty/transparent slot never blocks
  // clicks on the page underneath; the banner itself re-enables them.
  // Sticky needs a containing block taller than the element to actually
  // engage — the wrapper sits at the bottom of body content and pins to
  // viewport bottom while the user scrolls the page above.
  return (
    <div className="pointer-events-none sticky bottom-4 z-50 w-full sm:bottom-6">
      <AnimatePresence mode="wait" initial={false}>
        {active ? (
          <BannerSlot key={active.id}>{active.element}</BannerSlot>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function BannerSlot({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 80, scale: 0.94, filter: 'blur(2px)' }
      }
      animate={
        reduceMotion
          ? { opacity: 1, transition: { duration: 0.18 } }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
              transition: {
                type: 'spring',
                stiffness: 280,
                damping: 26,
                mass: 0.9,
              },
            }
      }
      exit={
        reduceMotion
          ? { opacity: 0, transition: { duration: 0.18 } }
          : {
              opacity: 0,
              y: 70,
              scale: 0.92,
              filter: 'blur(4px)',
              transition: { duration: 0.36, ease: [0.32, 0, 0.67, 0] },
            }
      }
    >
      {children}
    </motion.div>
  );
}

export function Banner(props: BannerProps) {
  const {
    id,
    priority = 0,
    variant,
    layout,
    position,
    icon,
    title,
    description,
    primaryAction,
    secondaryAction,
    dismissable,
    closeLabel,
    onDismiss,
    className,
  } = props;

  useEffect(() => {
    return () => removeEntry(id);
  }, [id]);

  useEffect(() => {
    upsertEntry({
      id,
      priority,
      element: (
        <BannerSurface
          id={id}
          variant={variant}
          layout={layout}
          position={position}
          icon={icon}
          title={title}
          description={description}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          dismissable={dismissable}
          closeLabel={closeLabel}
          onDismiss={onDismiss}
          className={className}
        />
      ),
    });
  }, [
    id,
    priority,
    variant,
    layout,
    position,
    icon,
    title,
    description,
    primaryAction,
    secondaryAction,
    dismissable,
    closeLabel,
    onDismiss,
    className,
  ]);

  return null;
}

/* ---------- visual surface ---------- */

const positionWrapperClasses: Record<BannerPosition, string> = {
  bottom: 'mx-auto',
  'bottom-center': 'mx-auto',
  'bottom-left': 'mr-auto ml-4',
  'bottom-right': 'ml-auto mr-4',
};

function BannerSurface({
  variant = 'plain',
  layout = 'auto',
  position = 'bottom',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  dismissable = true,
  closeLabel = 'Close',
  onDismiss,
  className,
}: BannerProps) {
  const isBrand = variant === 'brand';
  const isCardOnly = layout === 'card';
  const isBarOnly = layout === 'bar';

  const containerBase =
    'pointer-events-auto w-[calc(100%-2rem)] max-w-[26rem]';

  const layoutClass =
    layout === 'card'
      ? ''
      : layout === 'bar'
        ? 'max-w-none w-[calc(100%-2rem)] mx-4 sm:mx-6'
        : 'md:max-w-none md:w-[calc(100%-3rem)] md:mx-6';

  const surfaceClass = cn(
    'relative w-full rounded-2xl shadow-lg shadow-black/10',
    isBrand
      ? 'bg-brand text-brand-foreground'
      : 'bg-card text-card-foreground border border-border dark:shadow-black/40',
  );

  const cardClass = cn(
    'flex flex-col gap-4 p-5',
    isBarOnly && 'hidden',
    !isBarOnly && !isCardOnly && 'md:hidden',
  );

  const barClass = cn(
    'hidden items-center gap-4 px-5 py-3',
    isBarOnly && 'flex',
    !isBarOnly && !isCardOnly && 'md:flex',
  );

  const iconClass = cn(
    'size-5 shrink-0',
    isBrand ? 'text-brand-foreground' : 'text-brand',
  );

  const closeButtonClass = cn(
    'inline-flex size-8 items-center justify-center rounded-md transition-colors',
    isBrand
      ? 'text-brand-foreground/80 hover:text-brand-foreground hover:bg-white/10'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
  );

  const renderedIcon =
    icon !== undefined ? (
      icon
    ) : (
      <BadgeCheckIcon className={iconClass} aria-hidden="true" />
    );

  const showClose = dismissable && Boolean(onDismiss);

  return (
    <div
      role="region"
      className={cn(
        containerBase,
        positionWrapperClasses[position],
        layoutClass,
        className,
      )}
    >
      <div className={surfaceClass}>
        {/* Card layout (mobile) */}
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            {renderedIcon}
            {showClose ? (
              <button
                type="button"
                onClick={onDismiss}
                aria-label={closeLabel}
                className={closeButtonClass}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            <p
              className={cn(
                'text-[15px] leading-snug font-semibold',
                isBrand ? 'text-brand-foreground' : 'text-foreground',
              )}
            >
              {title}
            </p>
            {description ? (
              <p
                className={cn(
                  'text-sm leading-snug',
                  isBrand
                    ? 'text-brand-foreground/80'
                    : 'text-muted-foreground',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>

          {primaryAction || secondaryAction ? (
            <div className="flex flex-col gap-2">
              {primaryAction ? (
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className={cn(
                    'inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3',
                    isBrand
                      ? 'bg-brand-700 text-brand-foreground hover:bg-brand-800 focus-visible:ring-white/40 dark:bg-brand-800 dark:hover:bg-brand-900'
                      : 'bg-brand text-brand-foreground hover:bg-brand/90 focus-visible:ring-brand/40',
                  )}
                >
                  {primaryAction.label}
                </button>
              ) : null}
              {secondaryAction ? (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className={cn(
                    'inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3',
                    isBrand
                      ? 'bg-white text-foreground hover:bg-white/90 focus-visible:ring-white/40'
                      : 'border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-ring/30',
                  )}
                >
                  {secondaryAction.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Bar layout (desktop) */}
        <div className={barClass}>
          {renderedIcon}
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={cn(
                'text-sm font-medium',
                isBrand ? 'text-brand-foreground' : 'text-foreground',
              )}
            >
              {title}
            </span>
            {description ? (
              <span
                className={cn(
                  'text-sm',
                  isBrand
                    ? 'text-brand-foreground/80'
                    : 'text-muted-foreground',
                )}
              >
                {description}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {secondaryAction ? (
              isBrand ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={secondaryAction.onClick}
                  className="bg-white text-foreground border-transparent hover:bg-white/90 hover:text-foreground"
                >
                  {secondaryAction.label}
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              )
            ) : null}
            {primaryAction ? (
              <Button
                size="lg"
                onClick={primaryAction.onClick}
                className={cn(
                  isBrand
                    ? 'bg-brand-700 text-brand-foreground hover:bg-brand-800 dark:bg-brand-800 dark:hover:bg-brand-900'
                    : 'bg-brand text-brand-foreground hover:bg-brand/90',
                )}
              >
                {primaryAction.label}
              </Button>
            ) : null}
            {showClose ? (
              <button
                type="button"
                onClick={onDismiss}
                aria-label={closeLabel}
                className={cn(closeButtonClass, 'ml-1')}
              >
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
