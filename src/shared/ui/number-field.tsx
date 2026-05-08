'use client';

import * as React from 'react';
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';

import { cn } from '@/shared/lib/utils';

/**
 * Numeric input built on top of `@base-ui/react/number-field`. Provides
 * keyboard stepping (arrows, PageUp/Down, Home/End), wheel-on-focus, drag
 * scrubbing, and locale-aware parsing/formatting out of the box.
 *
 * Compose like:
 *
 * ```tsx
 * <NumberField min={1} max={100} step={1} value={x} onValueChange={setX}>
 *   <NumberFieldGroup>
 *     <NumberFieldDecrement />
 *     <NumberFieldInput />
 *     <NumberFieldIncrement />
 *   </NumberFieldGroup>
 * </NumberField>
 * ```
 */
function NumberField({ ...props }: NumberFieldPrimitive.Root.Props) {
  return <NumberFieldPrimitive.Root data-slot="number-field" {...props} />;
}

function NumberFieldGroup({
  className,
  ...props
}: NumberFieldPrimitive.Group.Props) {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn(
        'group/number-field relative flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-colors outline-none has-disabled:bg-input/50 has-disabled:opacity-50 has-[[data-slot=number-field-input]:focus-visible]:border-ring has-[[data-slot=number-field-input]:focus-visible]:ring-3 has-[[data-slot=number-field-input]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:bg-input/30 dark:has-disabled:bg-input/80 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

function NumberFieldInput({
  className,
  ...props
}: NumberFieldPrimitive.Input.Props) {
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      className={cn(
        'flex-1 min-w-0 bg-transparent px-2.5 py-1 text-base text-foreground tabular-nums transition-colors outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

const stepperButtonClass =
  'inline-flex shrink-0 items-center justify-center px-2 text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&_svg:not([class*=size-])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0';

function NumberFieldDecrement({
  className,
  children,
  ...props
}: NumberFieldPrimitive.Decrement.Props) {
  return (
    <NumberFieldPrimitive.Decrement
      data-slot="number-field-decrement"
      className={cn(
        stepperButtonClass,
        'order-first border-r border-input',
        className,
      )}
      {...props}
    >
      {children ?? <DefaultDecrementIcon />}
    </NumberFieldPrimitive.Decrement>
  );
}

function NumberFieldIncrement({
  className,
  children,
  ...props
}: NumberFieldPrimitive.Increment.Props) {
  return (
    <NumberFieldPrimitive.Increment
      data-slot="number-field-increment"
      className={cn(
        stepperButtonClass,
        'order-last border-l border-input',
        className,
      )}
      {...props}
    >
      {children ?? <DefaultIncrementIcon />}
    </NumberFieldPrimitive.Increment>
  );
}

function NumberFieldScrubArea({
  className,
  ...props
}: NumberFieldPrimitive.ScrubArea.Props) {
  return (
    <NumberFieldPrimitive.ScrubArea
      data-slot="number-field-scrub-area"
      className={cn(
        'inline-flex shrink-0 cursor-ns-resize items-center justify-center px-2 text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function DefaultDecrementIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function DefaultIncrementIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Optional addon — drop arbitrary content (icons, suffixes) inside the same
 * bordered group as the input. Uses `data-align` to flip ordering, mirroring
 * `InputGroupAddon` so the rest of the codebase stays consistent.
 */
function NumberFieldAddon({
  className,
  align = 'inline-end',
  ...props
}: React.ComponentProps<'div'> & {
  align?: 'inline-start' | 'inline-end';
}) {
  return (
    <div
      data-slot="number-field-addon"
      data-align={align}
      className={cn(
        'inline-flex shrink-0 items-center px-2.5 text-sm font-medium text-muted-foreground select-none data-[align=inline-end]:order-last data-[align=inline-start]:order-first',
        className,
      )}
      {...props}
    />
  );
}

export {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
  NumberFieldScrubArea,
  NumberFieldAddon,
};
