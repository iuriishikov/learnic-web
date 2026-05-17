'use client';

import * as React from 'react';
import { CheckIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
import { optionRowCls } from '@/shared/ui/overlay';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';

// Popover-based single-select used inside other inputs (phone country
// prefix, currency suffix). Matches SingleSelectV2's panel look-and-feel:
// brand check on selected, staggered item enter animations, hover bg.

export type EmbeddedOption = {
  value: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
};

export function EmbeddedPicker({
  options,
  value,
  onChange,
  disabled,
  align = 'start',
  triggerClassName,
  ariaLabel,
  renderTrigger,
}: {
  options: EmbeddedOption[];
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  align?: 'start' | 'end';
  triggerClassName?: string;
  ariaLabel: string;
  renderTrigger: (
    selected: EmbeddedOption | undefined,
    open: boolean,
  ) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const reduce = useReducedMotion() ?? false;
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-input-control=""
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          'group/embedded-trigger inline-flex h-full cursor-pointer items-center gap-1 bg-transparent text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60',
          triggerClassName,
        )}
      >
        {renderTrigger(selected, open)}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={6}
        className="w-auto min-w-44 max-w-72 gap-0 p-0"
      >
        <div className="flex max-h-72 flex-col overflow-y-auto overscroll-contain p-1.5">
          <ul className="flex flex-col gap-0.5" role="listbox">
            <AnimatePresence initial={false}>
              {options.map((option, i) => {
                const isSelected = option.value === value;
                return (
                  <motion.li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    initial={reduce ? false : { opacity: 0, y: -3 }}
                    animate={
                      reduce
                        ? { opacity: 1 }
                        : {
                            opacity: 1,
                            y: 0,
                            transition: {
                              delay: Math.min(i * 0.018, 0.18),
                              duration: 0.16,
                            },
                          }
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      data-selected={isSelected || undefined}
                      className={cn(
                        optionRowCls,
                        'hover:bg-muted focus-visible:bg-muted',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="font-medium text-foreground">
                          {option.label}
                        </span>
                        {option.meta != null && (
                          <>
                            {' '}
                            <span className="text-muted-foreground">
                              {option.meta}
                            </span>
                          </>
                        )}
                      </span>
                      {isSelected && (
                        <motion.span
                          initial={reduce ? false : { scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 28,
                          }}
                          className="ml-auto inline-flex shrink-0 text-brand"
                        >
                          <CheckIcon className="size-4" />
                        </motion.span>
                      )}
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Animated chevron for embedded trigger (rotates 180° when popover open).
export function EmbeddedChevron({ open }: { open: boolean }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.span
      animate={reduce ? undefined : { rotate: open ? 180 : 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="inline-flex shrink-0 items-center text-muted-foreground"
      aria-hidden
    >
      <svg
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3"
      >
        <path d="M2.5 4.5 6 8l3.5-3.5" />
      </svg>
    </motion.span>
  );
}
