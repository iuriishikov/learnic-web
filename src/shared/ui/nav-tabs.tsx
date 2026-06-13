'use client';

import {
  LazyMotion,
  MotionConfig,
  domMax,
  m,
  useReducedMotion,
} from 'motion/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from 'react';

import { cn } from '@/shared/lib/utils';

export type NavTab = {
  key: string;
  label: string;
  badge?: number | string;
};

export type NavTabsVariant = 'underline' | 'pill';

export type NavTabsProps = {
  tabs: NavTab[];
  /** Controlled active tab key. Pair with `onChange`. `null` → no tab active. */
  activeKey?: string | null;
  /** Initial active tab key for uncontrolled mode. Ignored when `activeKey` is provided. */
  defaultActiveKey?: string;
  /** Fired when the user picks a tab — both controlled and uncontrolled modes. */
  onChange?: (key: string) => void;
  /** Visual style. Defaults to `underline`. */
  variant?: NavTabsVariant;
  /** Stable identifier — kept for API parity / multi-instance scoping. */
  layoutId: string;
  /** aria-label for the wrapping nav element. */
  ariaLabel: string;
  className?: string;
};

const INDICATOR_SPRING = {
  type: 'spring',
  stiffness: 700,
  damping: 40,
  mass: 0.55,
} as const;

const SOFT_OUT = [0.22, 0.61, 0.36, 1] as const;

type IndicatorRect = { x: number; width: number };

export function NavTabs({
  tabs,
  activeKey,
  defaultActiveKey,
  onChange,
  variant = 'underline',
  ariaLabel,
  className,
}: NavTabsProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduced = prefersReducedMotion ?? false;

  const isControlled = activeKey !== undefined;
  const [internalActiveKey, setInternalActiveKey] = useState<string | undefined>(
    defaultActiveKey,
  );
  const effectiveActiveKey = isControlled ? activeKey : internalActiveKey;

  const handleSelect = useCallback(
    (key: string) => {
      if (!isControlled) setInternalActiveKey(key);
      onChange?.(key);
    },
    [isControlled, onChange],
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !effectiveActiveKey) return;
    const tab = tabRefs.current.get(effectiveActiveKey);
    if (!tab) return;

    const measure = () => {
      setIndicator({ x: tab.offsetLeft, width: tab.offsetWidth });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(tab);
    return () => ro.disconnect();
  }, [effectiveActiveKey, tabs]);

  const registerTabRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      if (el) tabRefs.current.set(key, el);
      else tabRefs.current.delete(key);
    },
    [],
  );

  const isUnderline = variant === 'underline';

  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig transition={reduced ? { duration: 0 } : INDICATOR_SPRING}>
        <div
          ref={containerRef}
          role="group"
          aria-label={ariaLabel}
          className={cn(
            'relative flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            isUnderline ? 'gap-7' : 'gap-1',
            className,
          )}
        >
          {indicator && effectiveActiveKey ? (
            <m.span
              aria-hidden
              initial={false}
              animate={{ x: indicator.x, width: indicator.width }}
              transition={reduced ? { duration: 0 } : INDICATOR_SPRING}
              className={cn(
                'pointer-events-none absolute left-0',
                isUnderline
                  ? '-bottom-px h-[3px] rounded-full bg-brand'
                  : 'inset-y-0 rounded-lg bg-surface-subtle',
              )}
            />
          ) : null}

          {tabs.map((tab) => (
            <NavTabItem
              key={tab.key}
              ref={registerTabRef(tab.key)}
              tab={tab}
              isActive={tab.key === effectiveActiveKey}
              variant={variant}
              onSelect={handleSelect}
              reducedMotion={reduced}
            />
          ))}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

type NavTabItemProps = {
  tab: NavTab;
  isActive: boolean;
  variant: NavTabsVariant;
  onSelect: ((key: string) => void) | undefined;
  reducedMotion: boolean;
  ref?: Ref<HTMLButtonElement>;
};

function NavTabItem({
  tab,
  isActive,
  variant,
  onSelect,
  reducedMotion,
  ref,
}: NavTabItemProps) {
  const isUnderline = variant === 'underline';

  // Show arrival overlays only when isActive transitions from false → true
  // on a tab that's already mounted. A tab that mounts already-active (e.g.
  // the default after a tab-set swap) sees prev === isActive on first effect
  // run and skips the state update, so the overlays never render for it.
  const [showArrival, setShowArrival] = useState(false);
  const prevIsActiveRef = useRef(isActive);
  useEffect(() => {
    const prev = prevIsActiveRef.current;
    prevIsActiveRef.current = isActive;
    if (prev === isActive) return;
    setShowArrival(isActive);
  }, [isActive]);
  const animateActivation = showArrival && !reducedMotion;

  return (
    <button
      ref={ref}
      type="button"
      aria-current={isActive ? 'true' : undefined}
      onClick={() => onSelect?.(tab.key)}
      className={cn(
        'group relative inline-flex shrink-0 items-center gap-2 bg-transparent text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-200',
        'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/40',
        isUnderline ? 'py-3' : 'rounded-lg px-3 py-2',
        isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
        !isActive && !isUnderline && 'hover:bg-foreground/5 dark:hover:bg-input/15',
      )}
    >
      {/* Pill: ring pulse expanding outward after the indicator arrives */}
      {animateActivation && !isUnderline ? (
        <m.span
          aria-hidden
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: [0, 0.4, 0], scale: [1, 1.05, 1.4] }}
          transition={{
            duration: 0.38,
            times: [0, 0.12, 1],
            ease: SOFT_OUT,
            delay: 0.12,
          }}
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-brand/35"
        />
      ) : null}

      {/* Underline: glow halo expanding vertically over the line on arrival */}
      {animateActivation && isUnderline ? (
        <m.span
          aria-hidden
          initial={{ opacity: 0, scaleX: 0.6, scaleY: 1 }}
          animate={{
            opacity: [0, 0.7, 0],
            scaleX: [0.6, 0.7, 1.3],
            scaleY: [1, 1.5, 5],
          }}
          transition={{
            duration: 0.38,
            times: [0, 0.12, 1],
            ease: SOFT_OUT,
            delay: 0.12,
          }}
          className="pointer-events-none absolute right-0 -bottom-px left-0 h-[3px] origin-center rounded-full bg-brand blur-[3px]"
        />
      ) : null}

      <span className="relative inline-flex items-center gap-2">
        <span>{tab.label}</span>
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
      </span>
    </button>
  );
}
