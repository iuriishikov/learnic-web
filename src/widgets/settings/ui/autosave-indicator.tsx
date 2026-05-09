'use client';

import { CheckCircleIcon, Loader2Icon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

type AutosaveIndicatorProps = {
  saving: boolean;
  justSaved: boolean;
  savingLabel: string;
  savedLabel: string;
};

/**
 * Tiny right-aligned status pill for auto-saving sections.
 *
 * Shows "Saving…" with a spinner while a write is in flight, then
 * "Saved" with a check for a brief TTL, otherwise renders nothing.
 * Drop into :class:`SettingsSection`'s ``headerActions`` slot.
 */
export function AutosaveIndicator({
  saving,
  justSaved,
  savingLabel,
  savedLabel,
}: AutosaveIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const status: 'saving' | 'saved' | 'idle' = saving
    ? 'saving'
    : justSaved
      ? 'saved'
      : 'idle';

  const enter = reduceMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, filter: 'blur(0px)' };
  const initial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 4, filter: 'blur(2px)' };
  const exit = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -4, filter: 'blur(2px)' };
  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <span className="relative inline-flex h-4 items-center">
      <AnimatePresence initial={false} mode="wait">
        {status === 'saving' ? (
          <motion.span
            key="saving"
            initial={initial}
            animate={enter}
            exit={exit}
            transition={transition}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            {savingLabel}
          </motion.span>
        ) : status === 'saved' ? (
          <motion.span
            key="saved"
            initial={initial}
            animate={enter}
            exit={exit}
            transition={transition}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
          >
            <motion.span
              initial={reduceMotion ? false : { scale: 0.6, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 520, damping: 22 }
              }
              className="inline-flex"
            >
              <CheckCircleIcon className="size-3.5" aria-hidden />
            </motion.span>
            {savedLabel}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
