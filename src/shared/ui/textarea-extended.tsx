'use client';

import * as React from 'react';
import { CircleAlertIcon, CircleHelpIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
import { TextareaAutosize } from '@/shared/ui/textarea-autosize';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

// ────────────────────────────────────────────────────────────────────────────
// Shell — bordered surface used by every textarea variant. Mirrors the
// styling tokens of the shadcn `Textarea` so the visual is identical, but
// accepts arbitrary children (used by the chips-inside variant).
// ────────────────────────────────────────────────────────────────────────────

type TextareaShellProps = React.ComponentProps<'div'> & {
  invalid?: boolean;
  disabled?: boolean;
  /** Force the visual focused state (for showcases / previews). */
  previewFocused?: boolean;
};

function TextareaShell({
  className,
  invalid,
  disabled,
  previewFocused,
  ...props
}: TextareaShellProps) {
  return (
    <div
      data-slot="textarea-shell"
      data-invalid={invalid ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      data-focused={previewFocused ? 'true' : undefined}
      className={cn(
        'group/textarea-shell relative flex min-h-32 w-full flex-col rounded-lg border border-input bg-transparent text-sm shadow-xs transition-[color,background-color,border-color,box-shadow] duration-150 ease-out outline-none',
        // focus-within ring (driven by the inner [data-textarea-control])
        'has-[[data-textarea-control]:focus-visible]:border-ring has-[[data-textarea-control]:focus-visible]:ring-4 has-[[data-textarea-control]:focus-visible]:ring-ring/20',
        // preview-focused (forced for showcases)
        'data-[focused=true]:border-ring data-[focused=true]:ring-4 data-[focused=true]:ring-ring/20',
        // invalid
        'data-[invalid=true]:border-destructive data-[invalid=true]:has-[[data-textarea-control]:focus-visible]:border-destructive data-[invalid=true]:has-[[data-textarea-control]:focus-visible]:ring-destructive/20',
        'data-[invalid=true]:data-[focused=true]:border-destructive data-[invalid=true]:data-[focused=true]:ring-destructive/20',
        // disabled
        'data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-muted/40 data-[disabled=true]:opacity-60',
        // dark-mode subtle bg
        'dark:bg-input/30 dark:data-[invalid=true]:border-destructive/50 dark:data-[invalid=true]:has-[[data-textarea-control]:focus-visible]:ring-destructive/40',
        className,
      )}
      {...props}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers — tag chip + help/error triggers
// ────────────────────────────────────────────────────────────────────────────

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

function ErrorBadge({ className }: { className?: string }) {
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

type TagChipProps = {
  label: string;
  onRemove?: () => void;
  disabled?: boolean;
  removeAriaLabel?: string;
};

function TagChip({ label, onRemove, disabled, removeAriaLabel }: TagChipProps) {
  return (
    <span
      data-slot="tag-chip"
      className="inline-flex h-6 items-center gap-1 rounded-md border border-input bg-background pr-1 pl-2 text-xs font-medium text-foreground"
    >
      {label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={removeAriaLabel ?? `Remove ${label}`}
          className="inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none disabled:cursor-not-allowed [&_svg]:size-3"
        >
          <XIcon />
        </button>
      ) : null}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DescriptionTextarea — column 1. Pure autosize: built on `TextareaAutosize`
// (`field-sizing: content` + `resize: none`), so it grows with content and
// has no manual resize handle. Adds the `previewFocused` visual state used
// by the showcase matrix on top of the shared base. Cap auto-grow with
// `max-h-*` if needed.
// ────────────────────────────────────────────────────────────────────────────

type DescriptionTextareaProps = React.ComponentProps<typeof TextareaAutosize> & {
  invalid?: boolean;
  /** Force the visual focused state (for showcases / previews). */
  previewFocused?: boolean;
};

function DescriptionTextarea({
  className,
  invalid,
  previewFocused,
  ...props
}: DescriptionTextareaProps) {
  return (
    <TextareaAutosize
      data-slot="description-textarea"
      data-focused={previewFocused ? 'true' : undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        'min-h-32',
        // preview-focused (showcases)
        'data-[focused=true]:border-ring data-[focused=true]:ring-4 data-[focused=true]:ring-ring/20',
        className,
      )}
      {...props}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Tag-management hook — shared between the two tag variants.
// ────────────────────────────────────────────────────────────────────────────

type UseTagsArgs = {
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
};

function useTagState({ values, defaultValues = [], onValuesChange }: UseTagsArgs) {
  const [internal, setInternal] = React.useState<string[]>(defaultValues);
  const items = values ?? internal;
  const [draft, setDraft] = React.useState('');

  const setItems = React.useCallback(
    (next: string[]) => {
      if (values === undefined) setInternal(next);
      onValuesChange?.(next);
    },
    [values, onValuesChange],
  );

  const commit = React.useCallback(() => {
    const v = draft.trim();
    if (!v) return;
    if (items.includes(v)) {
      setDraft('');
      return;
    }
    setItems([...items, v]);
    setDraft('');
  }, [draft, items, setItems]);

  const removeAt = React.useCallback(
    (index: number) => {
      setItems(items.filter((_, i) => i !== index));
    },
    [items, setItems],
  );

  return { items, draft, setDraft, commit, removeAt };
}

function TagInputControl({
  value,
  onChange,
  onCommit,
  onBackspaceEmpty,
  disabled,
  invalid,
  placeholder,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  onCommit: () => void;
  onBackspaceEmpty: () => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      data-textarea-control=""
      type="text"
      value={value}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          onCommit();
        } else if (e.key === 'Backspace' && !value) {
          onBackspaceEmpty();
        }
      }}
      onBlur={onCommit}
      className={cn(
        'h-7 min-w-[6ch] flex-1 bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed',
        className,
      )}
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TagsTextarea — column 2. Tags appear *inside* the shell, alongside the
// input. The shell is textarea-shaped (min-h-32) so it always reads as a
// big tag basket, not a one-row chip strip.
// ────────────────────────────────────────────────────────────────────────────

type TagsTextareaProps = {
  invalid?: boolean;
  disabled?: boolean;
  previewFocused?: boolean;
  values?: string[];
  defaultValues?: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  removeLabel?: string;
  className?: string;
};

function TagsTextarea({
  invalid,
  disabled,
  previewFocused,
  values,
  defaultValues,
  onValuesChange,
  placeholder = 'Add tag',
  removeLabel,
  className,
}: TagsTextareaProps) {
  const { items, draft, setDraft, commit, removeAt } = useTagState({
    values,
    defaultValues,
    onValuesChange,
  });
  const reduce = useReducedMotion();

  return (
    <TextareaShell
      invalid={invalid}
      disabled={disabled}
      previewFocused={previewFocused}
      className={cn('p-2', className)}
    >
      <div className="flex flex-1 flex-wrap content-start items-start gap-1.5">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.span
              key={item + i}
              initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className="inline-flex"
            >
              <TagChip
                label={item}
                onRemove={() => removeAt(i)}
                disabled={disabled}
                removeAriaLabel={removeLabel ? `${removeLabel} ${item}` : undefined}
              />
            </motion.span>
          ))}
        </AnimatePresence>
        <TagInputControl
          value={draft}
          onChange={setDraft}
          onCommit={commit}
          onBackspaceEmpty={() => items.length && removeAt(items.length - 1)}
          disabled={disabled}
          invalid={invalid}
          placeholder={items.length === 0 ? placeholder : ''}
        />
      </div>
    </TextareaShell>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TagsTextareaBelow — column 3. The shell holds only the input; committed
// tags render *below* the shell as a chip row. Useful when the tag list
// can grow long and shouldn't crowd the typing surface.
// ────────────────────────────────────────────────────────────────────────────

function TagsTextareaBelow({
  invalid,
  disabled,
  previewFocused,
  values,
  defaultValues,
  onValuesChange,
  placeholder = 'Add tag',
  removeLabel,
  className,
}: TagsTextareaProps) {
  const { items, draft, setDraft, commit, removeAt } = useTagState({
    values,
    defaultValues,
    onValuesChange,
  });
  const reduce = useReducedMotion();

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <TextareaShell
        invalid={invalid}
        disabled={disabled}
        previewFocused={previewFocused}
        className="p-2"
      >
        <div className="flex flex-1 items-start">
          <TagInputControl
            value={draft}
            onChange={setDraft}
            onCommit={commit}
            onBackspaceEmpty={() => items.length && removeAt(items.length - 1)}
            disabled={disabled}
            invalid={invalid}
            placeholder={placeholder}
            className="px-2"
          />
        </div>
      </TextareaShell>
      <AnimatePresence initial={false}>
        {items.length > 0 ? (
          <motion.div
            key="chips-below"
            initial={reduce ? undefined : { opacity: 0, y: -4 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap gap-1.5"
          >
            <AnimatePresence initial={false}>
              {items.map((item, i) => (
                <motion.span
                  key={item + i}
                  initial={reduce ? undefined : { opacity: 0, scale: 0.85 }}
                  animate={reduce ? undefined : { opacity: 1, scale: 1 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  className="inline-flex"
                >
                  <TagChip
                    label={item}
                    onRemove={() => removeAt(i)}
                    disabled={disabled}
                    removeAriaLabel={
                      removeLabel ? `${removeLabel} ${item}` : undefined
                    }
                  />
                </motion.span>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TextareaFieldRow — label (with optional help icon) + control + hint/error,
// animated. Mirrors `FieldRow` from input-extended but renders the help
// trigger next to the label, matching the references.
// ────────────────────────────────────────────────────────────────────────────

type TextareaFieldRowProps = {
  id?: string;
  label?: React.ReactNode;
  required?: boolean;
  helpTooltip?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

function TextareaFieldRow({
  id,
  label,
  required,
  helpTooltip,
  hint,
  error,
  className,
  children,
}: TextareaFieldRowProps) {
  const reduce = useReducedMotion();
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label ? (
        <div className="flex items-center gap-1.5">
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
          {helpTooltip ? <HelpTrigger content={helpTooltip} /> : null}
        </div>
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

export {
  TextareaShell,
  DescriptionTextarea,
  TagsTextarea,
  TagsTextareaBelow,
  TextareaFieldRow,
  HelpTrigger as TextareaHelpTrigger,
  ErrorBadge as TextareaErrorBadge,
  TagChip,
};
