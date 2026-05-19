'use client';

import { XIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { cn } from '@/shared/lib/utils';

const STORAGE_PREFIX = 'learnic.promo-card.';

export type PromoCardAction = {
  label: ReactNode;
  onClick?: () => void;
  href?: string;
};

export type PromoCardSize = 'sm' | 'default' | 'lg';

export type PromoCardProps = {
  /**
   * Custom visual rendered above the title. Use it for progress rings, avatar
   * groups, illustrations — anything you want as the card's hero element.
   */
  visual?: ReactNode;
  /** Bold heading shown below the visual. */
  title: ReactNode;
  /** Inline accessory next to the title, e.g. a "Live" badge. */
  titleAccessory?: ReactNode;
  /** Description paragraph between title and actions. */
  description?: ReactNode;
  /** Right-side brand-coloured text action. */
  primaryAction?: PromoCardAction;
  /**
   * Left-side text action. When omitted but `showDismissButton` is true,
   * a default "Dismiss" button is rendered that simply closes the card.
   */
  dismissAction?: PromoCardAction;
  /** Render the left "Dismiss" text button (default: true). */
  showDismissButton?: boolean;
  /** Default label for the dismiss text button. */
  dismissLabel?: ReactNode;
  /** Render the × icon in the top-right corner (default: true). */
  showCloseIcon?: boolean;
  /** Accessible label for the × icon. */
  closeLabel?: string;
  /** Fired whenever the card is closed (via × or dismiss button). */
  onDismiss?: () => void;
  /**
   * When set, the dismissal is persisted to `localStorage` under this key so
   * the card stays hidden on subsequent visits. When omitted, dismissal is
   * remembered only for the current page session.
   */
  storageKey?: string;
  /** Compact / default / hero. */
  size?: PromoCardSize;
  className?: string;
};

const SIZE_STYLES: Record<
  PromoCardSize,
  {
    container: string;
    closeButton: string;
    closeIcon: string;
    title: string;
    description: string;
    contentGap: string;
    actionsGap: string;
    action: string;
  }
> = {
  sm: {
    container: 'gap-3 rounded-xl p-4',
    closeButton: 'size-7',
    closeIcon: 'size-4',
    title: 'text-sm',
    description: 'text-xs',
    contentGap: 'space-y-1.5',
    actionsGap: 'gap-4',
    action: 'text-xs',
  },
  default: {
    container: 'gap-4 rounded-2xl p-5',
    closeButton: 'size-8',
    closeIcon: 'size-5',
    title: 'text-base',
    description: 'text-sm',
    contentGap: 'space-y-2',
    actionsGap: 'gap-6',
    action: 'text-sm',
  },
  lg: {
    container: 'gap-5 rounded-3xl p-6',
    closeButton: 'size-9',
    closeIcon: 'size-5',
    title: 'text-lg',
    description: 'text-base',
    contentGap: 'space-y-2.5',
    actionsGap: 'gap-8',
    action: 'text-base',
  },
};

/* ---------- localStorage helpers ---------- */

function fullKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}

function readStored(key: string | undefined): boolean {
  if (!key || typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(fullKey(key)) === '1';
  } catch {
    return false;
  }
}

function writeStored(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(fullKey(key), '1');
    window.dispatchEvent(new StorageEvent('storage', { key: fullKey(key) }));
  } catch {
    // private-mode / quota errors — fall through to in-memory state.
  }
}

function clearStored(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(fullKey(key));
    window.dispatchEvent(new StorageEvent('storage', { key: fullKey(key) }));
  } catch {
    // ignore
  }
}

/** Clear the persisted dismissal for a given key so the card reappears. */
export function resetPromoCardDismissal(key: string) {
  clearStored(key);
}

function useStoredDismissed(key: string | undefined): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !key) return () => undefined;
      const target = fullKey(key);
      function handle(event: StorageEvent) {
        if (event.key === null || event.key === target) onChange();
      }
      window.addEventListener('storage', handle);
      return () => window.removeEventListener('storage', handle);
    },
    () => readStored(key),
    () => false,
  );
}

/* ---------- component ---------- */

export function PromoCard({
  visual,
  title,
  titleAccessory,
  description,
  primaryAction,
  dismissAction,
  showDismissButton = true,
  dismissLabel = 'Dismiss',
  showCloseIcon = true,
  closeLabel = 'Close',
  onDismiss,
  storageKey,
  size = 'default',
  className,
}: PromoCardProps) {
  const sizeStyles = SIZE_STYLES[size];
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descriptionId = `${reactId}-description`;

  const persisted = useStoredDismissed(storageKey);
  const [localDismissed, setLocalDismissed] = useState(false);
  const dismissed = storageKey ? persisted : localDismissed;

  const reduceMotion = useReducedMotion();

  const close = useCallback(() => {
    if (storageKey) {
      writeStored(storageKey);
    } else {
      setLocalDismissed(true);
    }
    onDismiss?.();
  }, [storageKey, onDismiss]);

  const handlePrimary = useCallback(() => {
    primaryAction?.onClick?.();
  }, [primaryAction]);

  const handleDismissAction = useCallback(() => {
    dismissAction?.onClick?.();
    close();
  }, [dismissAction, close]);

  return (
    <AnimatePresence initial={false}>
      {!dismissed ? (
        <motion.div
          role="region"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
          }
          animate={
            reduceMotion
              ? { opacity: 1, transition: { duration: 0.18 } }
              : {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 28,
                    mass: 0.9,
                  },
                }
          }
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: 0.18 } }
              : {
                  opacity: 0,
                  y: -4,
                  transition: { duration: 0.24, ease: [0.32, 0, 0.67, 0] },
                }
          }
          data-size={size}
          className={cn(
            'relative flex h-full w-full flex-col bg-card ring-1 ring-foreground/10 transition-shadow duration-150',
            sizeStyles.container,
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3">
            {visual ? (
              <div className="min-w-0 flex-1">{visual}</div>
            ) : (
              <span aria-hidden className="flex-1" />
            )}
            {showCloseIcon ? (
              <button
                type="button"
                onClick={close}
                aria-label={closeLabel}
                className={cn(
                  'inline-flex shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                  sizeStyles.closeButton,
                )}
              >
                <XIcon className={sizeStyles.closeIcon} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className={sizeStyles.contentGap}>
            <div className="flex flex-wrap items-center gap-2">
              <p
                id={titleId}
                className={cn(
                  'font-semibold leading-snug text-foreground',
                  sizeStyles.title,
                )}
              >
                {title}
              </p>
              {titleAccessory}
            </div>
            {description ? (
              <p
                id={descriptionId}
                className={cn(
                  'leading-snug text-muted-foreground',
                  sizeStyles.description,
                )}
              >
                {description}
              </p>
            ) : null}
          </div>

          {primaryAction || dismissAction || showDismissButton ? (
            <div className={cn('mt-auto flex items-center', sizeStyles.actionsGap)}>
              {showDismissButton || dismissAction
                ? renderTextAction({
                    action: dismissAction ?? { label: dismissLabel },
                    onClick: handleDismissAction,
                    tone: 'neutral',
                    sizeClass: sizeStyles.action,
                  })
                : null}
              {primaryAction
                ? renderTextAction({
                    action: primaryAction,
                    onClick: handlePrimary,
                    tone: 'brand',
                    sizeClass: sizeStyles.action,
                  })
                : null}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function renderTextAction({
  action,
  onClick,
  tone,
  sizeClass,
}: {
  action: PromoCardAction;
  onClick: () => void;
  tone: 'neutral' | 'brand';
  sizeClass: string;
}) {
  const className = cn(
    'rounded-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
    sizeClass,
    tone === 'brand'
      ? 'text-brand hover:text-brand-700 dark:hover:text-brand-300'
      : 'text-foreground hover:text-foreground/70',
  );

  if (action.href) {
    return (
      <a href={action.href} onClick={onClick} className={className}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {action.label}
    </button>
  );
}
