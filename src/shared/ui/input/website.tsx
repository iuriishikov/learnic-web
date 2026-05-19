'use client';

import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { InputVariantProps } from './common';
import {
  Divider,
  InputShell,
  ShellInput,
  SideAddon,
  SwapIndicator,
  TrailingSlot,
} from './shell';

type WebsiteInputProps = InputVariantProps & {
  copyLabel?: string;
  onCopy?: () => void;
};

// Website / public-URL field with a built-in "Copy" affordance. The copy
// button briefly swaps to a check icon to acknowledge the action.
export function WebsiteInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  copyLabel = 'Copy',
  className,
  onCopy,
  value,
  defaultValue,
  ...props
}: WebsiteInputProps) {
  const [copied, setCopied] = React.useState(false);
  const reduce = useReducedMotion();
  const handleCopy = React.useCallback(() => {
    const v = (value ?? defaultValue ?? '') as string;
    if (typeof navigator !== 'undefined' && navigator.clipboard && v) {
      navigator.clipboard.writeText(String(v)).catch(() => {});
    }
    setCopied(true);
    onCopy?.();
  }, [onCopy, value, defaultValue]);

  React.useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(id);
  }, [copied]);

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <ShellInput
        type="url"
        inputMode="url"
        autoComplete="url"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
      {invalid || helpTooltip != null ? (
        <TrailingSlot className="pr-2">
          <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
        </TrailingSlot>
      ) : null}
      <Divider />
      <SideAddon>
        <motion.button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          whileTap={reduce ? undefined : { scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="inline-flex h-full items-center gap-1.5 rounded-r-[7px] bg-transparent px-3 text-sm font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          <span className="relative inline-flex size-3.5 items-center justify-center">
            <AnimatePresence initial={false} mode="popLayout">
              {copied ? (
                <motion.span
                  key="check"
                  initial={
                    reduce
                      ? undefined
                      : { scale: 0, rotate: -45, opacity: 0 }
                  }
                  animate={
                    reduce ? undefined : { scale: 1, rotate: 0, opacity: 1 }
                  }
                  exit={
                    reduce ? undefined : { scale: 0, rotate: 45, opacity: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute inset-0 text-brand"
                >
                  <CheckIcon className="size-3.5" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={
                    reduce
                      ? undefined
                      : { scale: 0, rotate: -45, opacity: 0 }
                  }
                  animate={
                    reduce ? undefined : { scale: 1, rotate: 0, opacity: 1 }
                  }
                  exit={
                    reduce ? undefined : { scale: 0, rotate: 45, opacity: 0 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute inset-0"
                >
                  <CopyIcon className="size-3.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          {copyLabel}
        </motion.button>
      </SideAddon>
    </InputShell>
  );
}
