'use client';

import * as React from 'react';
import { EyeIcon, EyeOffIcon, LockIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { InputVariantProps } from './common';
import {
  ErrorIndicator,
  InputShell,
  LeadingIcon,
  ShellInput,
  TrailingSlot,
} from './shell';

type PasswordInputProps = InputVariantProps & {
  toggleLabel?: { show: string; hide: string };
};

export function PasswordInput({
  invalid,
  disabled,
  previewFocused,
  // Destructured to keep it out of the DOM-spread `...props`. The password
  // variant shows the eye toggle instead of the "?" tooltip, so the value
  // is intentionally unused.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  helpTooltip,
  toggleLabel,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = React.useState(false);
  const reduce = useReducedMotion();

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <LeadingIcon>
        <LockIcon />
      </LeadingIcon>
      <ShellInput
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pl-2"
        {...props}
      />
      <TrailingSlot className="gap-1">
        <AnimatePresence initial={false}>
          {invalid ? (
            <motion.span
              key="err"
              initial={reduce ? undefined : { scale: 0, opacity: 0 }}
              animate={reduce ? undefined : { scale: 1, opacity: 1 }}
              exit={reduce ? undefined : { scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              className="inline-flex items-center"
            >
              <ErrorIndicator />
            </motion.span>
          ) : null}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          whileTap={reduce ? undefined : { scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          aria-label={
            visible ? (toggleLabel?.hide ?? 'Hide') : (toggleLabel?.show ?? 'Show')
          }
          className="inline-flex size-7 -mr-1 items-center justify-center rounded-md text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed [&_svg]:size-4"
        >
          <span className="relative inline-flex size-4 items-center justify-center">
            <AnimatePresence initial={false} mode="popLayout">
              {visible ? (
                <motion.span
                  key="off"
                  initial={
                    reduce ? undefined : { rotate: -90, opacity: 0, scale: 0.5 }
                  }
                  animate={
                    reduce ? undefined : { rotate: 0, opacity: 1, scale: 1 }
                  }
                  exit={
                    reduce ? undefined : { rotate: 90, opacity: 0, scale: 0.5 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute inset-0 inline-flex items-center justify-center"
                >
                  <EyeOffIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="on"
                  initial={
                    reduce ? undefined : { rotate: -90, opacity: 0, scale: 0.5 }
                  }
                  animate={
                    reduce ? undefined : { rotate: 0, opacity: 1, scale: 1 }
                  }
                  exit={
                    reduce ? undefined : { rotate: 90, opacity: 0, scale: 0.5 }
                  }
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute inset-0 inline-flex items-center justify-center"
                >
                  <EyeIcon />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.button>
      </TrailingSlot>
    </InputShell>
  );
}
