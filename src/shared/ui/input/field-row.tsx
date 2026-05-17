'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';

type FieldRowProps = {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

// Label + control + hint/error wrapper used uniformly across forms.
// Animates between hint and error so the helper text doesn't jump
// when validation flips.
export function FieldRow({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: FieldRowProps) {
  const reduce = useReducedMotion();
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label ? (
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none text-foreground"
        >
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-brand">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      <AnimatePresence initial={false} mode="popLayout">
        {error ? (
          <motion.p
            key="error"
            initial={reduce ? undefined : { opacity: 0, y: -2 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={reduce ? undefined : { opacity: 0, y: -2 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="text-sm text-muted-foreground"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
