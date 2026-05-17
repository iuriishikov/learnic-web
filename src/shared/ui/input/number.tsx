'use client';

import { MinusIcon, PlusIcon } from 'lucide-react';
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';

import { cn } from '@/shared/lib/utils';

import type { CommonInputProps } from './common';

// Number variants share styling but differ in chrome layout —
// `stepper` has wide `−` / `+` buttons on the left and right of the
// input; `spinner` stacks small `▲` / `▼` triangles on the right edge.

type NumberInputProps = CommonInputProps & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  decrementLabel?: string;
  incrementLabel?: string;
  id?: string;
  name?: string;
};

const GROUP_CLS =
  'group/input-shell relative flex h-10 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-ring/20 has-disabled:cursor-not-allowed has-disabled:bg-muted/40 has-disabled:opacity-60 dark:bg-input/30';

function groupCls({
  invalid,
  previewFocused,
  className,
}: Pick<NumberInputProps, 'invalid' | 'previewFocused' | 'className'>) {
  return cn(
    GROUP_CLS,
    previewFocused && 'border-ring ring-4 ring-ring/20',
    invalid &&
      'border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/20',
    invalid && previewFocused && 'border-destructive ring-destructive/20',
    className,
  );
}

export function NumberStepperInput({
  invalid,
  disabled,
  previewFocused,
  className,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  placeholder,
  decrementLabel = 'Decrement',
  incrementLabel = 'Increment',
  id,
  name,
}: NumberInputProps) {
  return (
    <NumberFieldPrimitive.Root
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      data-slot="number-stepper"
    >
      <NumberFieldPrimitive.Group
        className={groupCls({ invalid, previewFocused, className })}
        data-invalid={invalid ? 'true' : undefined}
      >
        <NumberFieldPrimitive.Decrement
          aria-label={decrementLabel}
          className="inline-flex w-10 shrink-0 items-center justify-center border-r border-input text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4"
        >
          <MinusIcon />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 bg-transparent px-2 text-center text-sm text-foreground tabular-nums transition-colors outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
        />
        <NumberFieldPrimitive.Increment
          aria-label={incrementLabel}
          className="inline-flex w-10 shrink-0 items-center justify-center border-l border-input text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4"
        >
          <PlusIcon />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}

export function NumberSpinnerInput({
  invalid,
  disabled,
  previewFocused,
  className,
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  placeholder,
  decrementLabel = 'Decrement',
  incrementLabel = 'Increment',
  id,
  name,
}: NumberInputProps) {
  return (
    <NumberFieldPrimitive.Root
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      data-slot="number-spinner"
    >
      <NumberFieldPrimitive.Group
        className={groupCls({ invalid, previewFocused, className })}
        data-invalid={invalid ? 'true' : undefined}
      >
        <NumberFieldPrimitive.Input
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground tabular-nums transition-colors outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
        />
        <div className="flex shrink-0 flex-col border-l border-input">
          <NumberFieldPrimitive.Increment
            aria-label={incrementLabel}
            className="inline-flex h-1/2 w-8 items-center justify-center text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3"
          >
            <ChevronUpIcon />
          </NumberFieldPrimitive.Increment>
          <NumberFieldPrimitive.Decrement
            aria-label={decrementLabel}
            className="inline-flex h-1/2 w-8 items-center justify-center border-t border-input text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3"
          >
            <ChevronDownIcon />
          </NumberFieldPrimitive.Decrement>
        </div>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  );
}

// Local chevron icons (size 3, sharper than lucide's default at this scale)
function ChevronUpIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.5 7.5 6 4l3.5 3.5" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}
