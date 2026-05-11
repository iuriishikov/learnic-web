'use client';

import * as React from 'react';
import {
  CalendarIcon,
  CheckIcon,
  CircleAlertIcon,
  CircleHelpIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field';

import { cn } from '@/shared/lib/utils';
import { optionRowCls } from '@/shared/ui/overlay';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

// ────────────────────────────────────────────────────────────────────────────
// Core shell — bordered surface that hosts the control + addons
// ────────────────────────────────────────────────────────────────────────────

type InputShellProps = React.ComponentProps<'div'> & {
  invalid?: boolean;
  disabled?: boolean;
  /** Force the visual focused state (for showcases / previews). */
  previewFocused?: boolean;
  /** Render the inner control as a single block (used by inputs that contain
   * multiple boxes like OTP / Tags). */
  unstyled?: boolean;
};

function InputShell({
  className,
  invalid,
  disabled,
  previewFocused,
  unstyled,
  ...props
}: InputShellProps) {
  return (
    <div
      data-slot="input-shell"
      data-invalid={invalid ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      data-focused={previewFocused ? 'true' : undefined}
      className={cn(
        'group/input-shell relative flex h-10 w-full min-w-0 items-center rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none',
        // focus-within ring (uses the inner control's focus-visible state)
        'has-[[data-input-control]:focus-visible]:border-ring has-[[data-input-control]:focus-visible]:ring-4 has-[[data-input-control]:focus-visible]:ring-ring/20',
        // preview-focused (forced for showcase rendering)
        'data-[focused=true]:border-ring data-[focused=true]:ring-4 data-[focused=true]:ring-ring/20',
        // invalid
        'data-[invalid=true]:border-destructive data-[invalid=true]:has-[[data-input-control]:focus-visible]:border-destructive data-[invalid=true]:has-[[data-input-control]:focus-visible]:ring-destructive/20',
        // invalid + preview-focused
        'data-[invalid=true]:data-[focused=true]:border-destructive data-[invalid=true]:data-[focused=true]:ring-destructive/20',
        // disabled
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-muted/40 data-[disabled=true]:opacity-60',
        // dark-mode subtle bg
        'dark:bg-input/30',
        unstyled && 'h-auto border-0 bg-transparent shadow-none p-0',
        className,
      )}
      {...props}
    />
  );
}

// Reusable info-help trigger ("?" circle) that lives inside the shell on the
// right. Always wraps in shadcn Tooltip — content falls back to a generic
// "Подсказка по полю" so the affordance still works when the consumer hasn't
// authored field-specific copy yet.
const DEFAULT_HELP_TOOLTIP = 'Подсказка по полю';

function HelpTrigger({
  content,
  className,
  ariaLabel,
}: {
  content?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const resolved = content ?? DEFAULT_HELP_TOOLTIP;
  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          aria-label={ariaLabel ?? 'More info'}
          className={cn(
            'inline-flex shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
            className,
          )}
        >
          <CircleHelpIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{resolved}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Trailing red error indicator (matches screenshots — small red circle "!")
function ErrorIndicator({ className }: { className?: string }) {
  return (
    <CircleAlertIcon
      aria-hidden
      className={cn(
        'pointer-events-none size-4 shrink-0 text-destructive',
        className,
      )}
    />
  );
}

// Plain text/number input slot inside the shell.
function ShellInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      data-input-control=""
      data-slot="shell-input"
      className={cn(
        'flex h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground tabular-nums-none transition-colors outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed disabled:text-muted-foreground/60 disabled:placeholder:text-muted-foreground/50',
        className,
      )}
      {...props}
    />
  );
}

// Inline icon slot (leading icon inside the input).
function LeadingIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      data-slot="leading-icon"
      aria-hidden
      className={cn(
        'pointer-events-none flex shrink-0 items-center pl-3 text-muted-foreground/80 [&>svg]:size-4',
        className,
      )}
    >
      {children}
    </span>
  );
}

// Trailing slot (icon, help-trigger, action, etc.) inside the shell.
function TrailingSlot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="trailing-slot"
      className={cn(
        'flex shrink-0 items-center gap-2 pr-3 text-muted-foreground/70',
        className,
      )}
    >
      {children}
    </div>
  );
}

// Vertical divider between a "side" addon and the input area.
function Divider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('h-full w-px shrink-0 bg-input', className)}
    />
  );
}

// Side addon (action button or selector) inside the shell, separated by a
// divider from the main input. Used for "Copy" / "Browse" buttons,
// country code selectors, currency selectors, etc.
function SideAddon({
  children,
  align = 'inline-end',
  className,
}: {
  children: React.ReactNode;
  align?: 'inline-start' | 'inline-end';
  className?: string;
}) {
  return (
    <div
      data-slot="side-addon"
      data-align={align}
      className={cn(
        'flex h-full shrink-0 items-stretch',
        align === 'inline-start' ? 'order-first' : 'order-last',
        className,
      )}
    >
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EmbeddedPicker — Popover-based single-select used inside other inputs
// (phone country prefix, currency suffix). Matches SingleSelectV2's panel
// look-and-feel: brand check on selected, item enter animations, hover bg.
// ────────────────────────────────────────────────────────────────────────────

type EmbeddedOption = {
  value: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
};

function EmbeddedPicker({
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
  renderTrigger: (selected: EmbeddedOption | undefined, open: boolean) => React.ReactNode;
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
                          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
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
function EmbeddedChevron({ open }: { open: boolean }) {
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

// ────────────────────────────────────────────────────────────────────────────
// Specialized variants
// ────────────────────────────────────────────────────────────────────────────

export type CommonInputProps = {
  invalid?: boolean;
  disabled?: boolean;
  /** Force the visual focused state (for showcases / previews). */
  previewFocused?: boolean;
  helpTooltip?: React.ReactNode;
  className?: string;
};

// ── Website (text input + Copy button) ─────────────────────────────────────
type WebsiteInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps & {
    copyLabel?: string;
    onCopy?: () => void;
  };

function WebsiteInput({
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
      <TrailingSlot className="pr-2">
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
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
                  initial={reduce ? undefined : { scale: 0, rotate: -45, opacity: 0 }}
                  animate={reduce ? undefined : { scale: 1, rotate: 0, opacity: 1 }}
                  exit={reduce ? undefined : { scale: 0, rotate: 45, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute inset-0 text-brand"
                >
                  <CheckIcon className="size-3.5" />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={reduce ? undefined : { scale: 0, rotate: -45, opacity: 0 }}
                  animate={reduce ? undefined : { scale: 1, rotate: 0, opacity: 1 }}
                  exit={reduce ? undefined : { scale: 0, rotate: 45, opacity: 0 }}
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

// Animated trailing indicator — swaps between help tooltip "?" and the
// error indicator when invalid state changes.
function SwapIndicator({
  invalid,
  helpTooltip,
}: {
  invalid?: boolean;
  helpTooltip?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-flex size-4 items-center justify-center">
      <AnimatePresence initial={false} mode="popLayout">
        {invalid ? (
          <motion.span
            key="err"
            initial={reduce ? undefined : { scale: 0, opacity: 0 }}
            animate={reduce ? undefined : { scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="absolute inset-0 inline-flex items-center justify-center"
          >
            <ErrorIndicator />
          </motion.span>
        ) : (
          <motion.span
            key="help"
            initial={reduce ? undefined : { scale: 0, opacity: 0 }}
            animate={reduce ? undefined : { scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="absolute inset-0 inline-flex items-center justify-center"
          >
            <HelpTrigger content={helpTooltip} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── HTTPS URL (https:// prefix) ────────────────────────────────────────────
type HttpsInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps;

function HttpsUrlInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  ...props
}: HttpsInputProps) {
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <SideAddon align="inline-start">
        <span className="inline-flex h-full items-center px-3 text-sm text-muted-foreground select-none">
          https://
        </span>
      </SideAddon>
      <Divider />
      <ShellInput
        type="url"
        inputMode="url"
        autoComplete="url"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}

// ── Password (lock + eye toggle) ───────────────────────────────────────────
type PasswordInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps & {
    toggleLabel?: { show: string; hide: string };
  };

function PasswordInput({
  invalid,
  disabled,
  previewFocused,
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
          aria-label={visible ? (toggleLabel?.hide ?? 'Hide') : (toggleLabel?.show ?? 'Show')}
          className="inline-flex size-7 -mr-1 items-center justify-center rounded-md text-muted-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed [&_svg]:size-4"
        >
          <span className="relative inline-flex size-4 items-center justify-center">
            <AnimatePresence initial={false} mode="popLayout">
              {visible ? (
                <motion.span
                  key="off"
                  initial={reduce ? undefined : { rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={reduce ? undefined : { rotate: 0, opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="absolute inset-0 inline-flex items-center justify-center"
                >
                  <EyeOffIcon />
                </motion.span>
              ) : (
                <motion.span
                  key="on"
                  initial={reduce ? undefined : { rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={reduce ? undefined : { rotate: 0, opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { rotate: 90, opacity: 0, scale: 0.5 }}
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

// ── Email (mail icon) ──────────────────────────────────────────────────────
type EmailInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps;

function EmailInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  ...props
}: EmailInputProps) {
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <LeadingIcon>
        <MailIcon />
      </LeadingIcon>
      <ShellInput
        type="email"
        inputMode="email"
        autoComplete="email"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pl-2"
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}

// ── Date / DateTime (calendar icon + format) ───────────────────────────────
type DateInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps;

function DateTimeInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  placeholder = 'MM/DD/YYYY – 00:00',
  ...props
}: DateInputProps) {
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <LeadingIcon>
        <CalendarIcon />
      </LeadingIcon>
      <ShellInput
        type="text"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pl-2 tabular-nums"
        placeholder={placeholder}
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}

// ── Number — stepper variant (− / + on sides) ──────────────────────────────
type NumberStepperProps = CommonInputProps & {
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

function NumberStepperInput({
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
}: NumberStepperProps) {
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
        className={cn(
          'group/input-shell relative flex h-10 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none',
          'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-ring/20',
          'has-disabled:cursor-not-allowed has-disabled:bg-muted/40 has-disabled:opacity-60',
          'dark:bg-input/30',
          previewFocused &&
            'border-ring ring-4 ring-ring/20',
          invalid &&
            'border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/20',
          invalid && previewFocused &&
            'border-destructive ring-destructive/20',
          className,
        )}
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

// ── Number — spinner variant (stacked ▲▼ on the right) ────────────────────
function NumberSpinnerInput({
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
}: NumberStepperProps) {
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
        className={cn(
          'group/input-shell relative flex h-10 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none',
          'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-ring/20',
          'has-disabled:cursor-not-allowed has-disabled:bg-muted/40 has-disabled:opacity-60',
          'dark:bg-input/30',
          previewFocused &&
            'border-ring ring-4 ring-ring/20',
          invalid &&
            'border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/20',
          invalid && previewFocused &&
            'border-destructive ring-destructive/20',
          className,
        )}
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

// ── Verification code (4-slot OTP) ─────────────────────────────────────────
type CodeInputProps = CommonInputProps & {
  length?: number;
  value?: string;
  onValueChange?: (value: string) => void;
};

function CodeInput({
  invalid,
  disabled,
  previewFocused,
  length = 4,
  value,
  onValueChange,
  className,
}: CodeInputProps) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const [internal, setInternal] = React.useState(value ?? '');
  const current = value ?? internal;

  function setValue(next: string) {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = current.padEnd(length, ' ').split('');
    chars[index] = digit || ' ';
    const next = chars.join('').replace(/\s+$/, '');
    setValue(next);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
      inputsRef.current[index - 1]?.select();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
      inputsRef.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
      inputsRef.current[index + 1]?.select();
    }
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const data = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!data) return;
    e.preventDefault();
    const chars = current.split('');
    for (let i = 0; i < data.length && index + i < length; i++) {
      chars[index + i] = data[i];
    }
    const next = chars.join('').slice(0, length);
    setValue(next);
    const focusIndex = Math.min(index + data.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
    inputsRef.current[focusIndex]?.select();
  }

  return (
    <div
      data-slot="code-input"
      className={cn('flex items-center gap-2', className)}
    >
      {Array.from({ length }).map((_, i) => {
        const ch = current[i] ?? '';
        return (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={ch}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.currentTarget.select()}
            className={cn(
              'h-12 w-12 rounded-lg border border-input bg-transparent text-center text-2xl font-medium text-foreground shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 outline-none',
              'placeholder:text-muted-foreground/60',
              'focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20',
              'disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60',
              'dark:bg-input/30',
              previewFocused && 'border-ring ring-4 ring-ring/20',
              invalid &&
                'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20',
              invalid && previewFocused && 'border-destructive ring-destructive/20',
              'aria-[invalid=true]:text-destructive',
            )}
          />
        );
      })}
    </div>
  );
}

// ── Upload file (text + Browse) ────────────────────────────────────────────
type FileInputProps = CommonInputProps & {
  placeholder?: string;
  browseLabel?: string;
  fileName?: string;
  defaultFileName?: string;
  accept?: string;
  onFileSelect?: (file: File | null) => void;
  id?: string;
};

function FileInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  placeholder = 'No file chosen',
  browseLabel = 'Browse',
  fileName,
  defaultFileName,
  accept,
  onFileSelect,
  id,
}: FileInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [internal, setInternal] = React.useState(defaultFileName ?? '');
  const current = fileName ?? internal;

  function open() {
    inputRef.current?.click();
  }

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (fileName === undefined) setInternal(f?.name ?? '');
          onFileSelect?.(f);
        }}
      />
      <button
        type="button"
        data-input-control=""
        onClick={open}
        disabled={disabled}
        className={cn(
          'flex h-full min-w-0 flex-1 cursor-text items-center px-3 text-left text-sm transition-colors outline-none disabled:cursor-not-allowed',
          current ? 'text-foreground' : 'text-muted-foreground/80',
          disabled && 'text-muted-foreground/60',
        )}
      >
        <span className="truncate">{current || placeholder}</span>
      </button>
      <TrailingSlot className="pr-2">
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
      <Divider />
      <SideAddon>
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className="inline-flex h-full items-center gap-1.5 rounded-r-[7px] bg-transparent px-3 text-sm font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {browseLabel}
        </button>
      </SideAddon>
    </InputShell>
  );
}

// ── Phone number (country code selector + phone input) ─────────────────────
type PhoneCountry = {
  value: string;
  label: string;
  prefix: string;
};

type PhoneInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps & {
    countries: PhoneCountry[];
    country?: string;
    defaultCountry?: string;
    onCountryChange?: (value: string) => void;
  };

function PhoneInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  countries,
  country,
  defaultCountry,
  onCountryChange,
  placeholder = '+1 (555) 000-0000',
  ...props
}: PhoneInputProps) {
  const [internal, setInternal] = React.useState(
    defaultCountry ?? countries[0]?.value ?? '',
  );
  const value = country ?? internal;

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <SideAddon align="inline-start">
        <EmbeddedPicker
          ariaLabel="Country"
          align="start"
          disabled={disabled}
          value={value}
          onChange={(v) => {
            if (country === undefined) setInternal(v);
            onCountryChange?.(v);
          }}
          options={countries.map((c) => ({
            value: c.value,
            label: `${c.value} — ${c.label}`,
            meta: c.prefix,
          }))}
          triggerClassName="pl-3 pr-2"
          renderTrigger={(_sel, open) => (
            <>
              <span className="font-medium">{value}</span>
              <EmbeddedChevron open={open} />
            </>
          )}
        />
      </SideAddon>
      <ShellInput
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}

// ── Money / sale amount (currency prefix + currency selector suffix) ──────
type Currency = { value: string; label: string };

type MoneyInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps & {
    currencies: Currency[];
    currency?: string;
    defaultCurrency?: string;
    onCurrencyChange?: (value: string) => void;
    prefix?: string;
  };

function MoneyInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  currencies,
  currency,
  defaultCurrency,
  onCurrencyChange,
  prefix = '$',
  placeholder = '1,000.00',
  ...props
}: MoneyInputProps) {
  const [internal, setInternal] = React.useState(
    defaultCurrency ?? currencies[0]?.value ?? 'USD',
  );
  const value = currency ?? internal;

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <SideAddon align="inline-start">
        <span className="inline-flex h-full items-center pl-3 pr-2 text-sm font-medium text-muted-foreground select-none">
          {prefix}
        </span>
      </SideAddon>
      <ShellInput
        type="text"
        inputMode="decimal"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        className="text-foreground tabular-nums"
        {...props}
      />
      <TrailingSlot className="pr-1">
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
      <SideAddon>
        <EmbeddedPicker
          ariaLabel="Currency"
          align="end"
          disabled={disabled}
          value={value}
          onChange={(v) => {
            if (currency === undefined) setInternal(v);
            onCurrencyChange?.(v);
          }}
          options={currencies.map((c) => ({
            value: c.value,
            label: `${c.value} — ${c.label}`,
          }))}
          triggerClassName="pl-2 pr-3"
          renderTrigger={(_sel, open) => (
            <>
              <span className="font-medium">{value}</span>
              <EmbeddedChevron open={open} />
            </>
          )}
        />
      </SideAddon>
    </InputShell>
  );
}

// ── Card number (card-brand icon + number) ─────────────────────────────────
type CardNumberInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'disabled' | 'className'
> &
  CommonInputProps;

function MasterCardIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg
      width="22"
      height="14"
      viewBox="0 0 24 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="9" cy="8" r="6.5" fill={filled ? '#EB001B' : '#EB001B'} opacity={filled ? 1 : 0.35} />
      <circle cx="15" cy="8" r="6.5" fill={filled ? '#F79E1B' : '#F79E1B'} opacity={filled ? 1 : 0.35} />
      <path
        d="M12 3.2A6.49 6.49 0 0 0 9.5 8a6.49 6.49 0 0 0 2.5 4.8A6.49 6.49 0 0 0 14.5 8 6.49 6.49 0 0 0 12 3.2Z"
        fill={filled ? '#FF5F00' : '#FF5F00'}
        opacity={filled ? 1 : 0.35}
      />
    </svg>
  );
}

function CardNumberInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  value,
  placeholder = '1234 1234 1234 1234',
  ...props
}: CardNumberInputProps) {
  const hasValue = Boolean(value);
  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={className}
    >
      <LeadingIcon className="pr-1">
        <MasterCardIcon filled={hasValue} />
      </LeadingIcon>
      <ShellInput
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
        value={value}
        className="pl-2 tabular-nums"
        {...props}
      />
      <TrailingSlot>
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}

// ── Tags (chips + free input) ──────────────────────────────────────────────
type TagsInputProps = CommonInputProps & {
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  removeLabel?: string;
};

function TagsInput({
  invalid,
  disabled,
  previewFocused,
  helpTooltip,
  className,
  values,
  defaultValues = [],
  onValuesChange,
  placeholder = 'Add tag',
  removeLabel = 'Remove',
}: TagsInputProps) {
  const [internal, setInternal] = React.useState<string[]>(defaultValues);
  const items = values ?? internal;
  const [draft, setDraft] = React.useState('');
  const reduce = useReducedMotion();

  function setItems(next: string[]) {
    if (values === undefined) setInternal(next);
    onValuesChange?.(next);
  }

  function commit() {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) {
      setDraft('');
      return;
    }
    setItems([...items, v]);
    setDraft('');
  }

  function removeAt(index: number) {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  }

  return (
    <InputShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={cn('min-h-10 h-auto flex-wrap py-1.5 pl-2 pr-2', className)}
    >
      <div className="flex w-full flex-wrap items-center gap-1.5">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.span
              key={item + i}
              initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="inline-flex h-6 items-center gap-1 rounded-md border border-input bg-background pl-2 pr-1 text-xs font-medium text-foreground"
            >
              {item}
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={disabled}
                aria-label={`${removeLabel} ${item}`}
                className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed [&_svg]:size-3"
              >
                <XIcon />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          data-input-control=""
          type="text"
          value={draft}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Backspace' && !draft && items.length) {
              removeAt(items.length - 1);
            }
          }}
          onBlur={commit}
          placeholder={items.length === 0 ? placeholder : ''}
          className="h-7 min-w-[6ch] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed"
        />
      </div>
      <TrailingSlot className="self-start py-1">
        <SwapIndicator invalid={invalid} helpTooltip={helpTooltip} />
      </TrailingSlot>
    </InputShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// FieldRow — label + control + hint/error wrapper
// ────────────────────────────────────────────────────────────────────────────

type FieldRowProps = {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function FieldRow({
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

// ────────────────────────────────────────────────────────────────────────────

export {
  // Shell + helpers (low-level)
  InputShell,
  ShellInput,
  LeadingIcon,
  TrailingSlot,
  SideAddon,
  Divider,
  HelpTrigger,
  ErrorIndicator,
  // Variants
  WebsiteInput,
  HttpsUrlInput as HttpsInput,
  PasswordInput,
  EmailInput,
  DateTimeInput,
  NumberStepperInput,
  NumberSpinnerInput,
  CodeInput,
  FileInput,
  PhoneInput,
  MoneyInput,
  CardNumberInput,
  TagsInput,
  // Row wrapper
  FieldRow,
};
