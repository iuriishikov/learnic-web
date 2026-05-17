'use client';

import * as React from 'react';
import { CircleAlertIcon, CircleHelpIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
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

// Animated trailing indicator — swaps between help tooltip "?" and the
// error indicator when invalid state changes. Lives in shell.tsx because
// every variant either uses it directly or composes around it.
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

export {
  InputShell,
  ShellInput,
  LeadingIcon,
  TrailingSlot,
  SideAddon,
  Divider,
  HelpTrigger,
  ErrorIndicator,
  SwapIndicator,
};
