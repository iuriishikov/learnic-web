'use client';

import { CheckIcon, PencilIcon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Kbd } from '@/shared/ui/kbd';

const TRANSITION = { duration: 0.18, ease: [0.32, 0.72, 0, 1] as const };

/**
 * Shared visual + behavioural shell for "click-to-edit" inline editors.
 *
 * Concrete editors (rich text, LaTeX, …) provide the read-mode body, the
 * empty-state placeholder, the actual editing surface and a few labels;
 * this shell owns the read↔edit transition (`AnimatePresence` in popLayout
 * so the parent layout doesn't collapse during the swap), the hover affordance
 * (a "edit" chip with a pencil icon), the explicit footer (Esc kbd hint +
 * brand-coloured Done button), and the universal exit triggers — Esc and
 * click-outside, both ignoring portal-rendered floating UI like shadcn
 * popovers and the tiptap bubble menu.
 */
export type InlineEditorShellProps = {
  isEditing: boolean;
  /** Fired on click in read mode AND on Enter/Space when the trigger is focused. */
  onEnterEdit: (event?: ReactMouseEvent<HTMLDivElement>) => void;
  onExitEdit: () => void;
  /** Read-mode body when `isEmpty` is false. */
  readContent: ReactNode;
  /** Read-mode body when `isEmpty` is true. */
  emptyContent: ReactNode;
  isEmpty: boolean;
  /** Edit-mode body — the actual editor instance. */
  editContent: ReactNode;
  /** Aria label for the read-mode trigger surface. */
  editAriaLabel: string;
  /** Tooltip-like chip rendered in the top-right corner on hover. */
  editChipLabel: string;
  /** Footer "done editing" button label. */
  doneLabel: string;
  /** Footer hint shown next to the Esc kbd. */
  hintExitLabel: string;
  /** Cursor for the read-mode trigger. `text` for prose, `pointer` for atomic content. */
  cursor?: 'text' | 'pointer';
  /** Extra classes applied to the read-mode trigger surface. */
  readClassName?: string;
  className?: string;
};

export function InlineEditorShell({
  isEditing,
  onEnterEdit,
  onExitEdit,
  readContent,
  emptyContent,
  isEmpty,
  editContent,
  editAriaLabel,
  editChipLabel,
  doneLabel,
  hintExitLabel,
  cursor = 'pointer',
  readClassName,
  className,
}: InlineEditorShellProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside closes the editor, while ignoring portal-rendered floating
  // UI from the embedded editor (shadcn popovers — link, color picker, image
  // form — base-ui Select dropdowns — font, size — and the tiptap bubble
  // menu, all of which render outside the container).
  useEffect(() => {
    if (!isEditing) return;
    const isInsidePortal = (target: HTMLElement) =>
      target.closest('[data-slot="popover-content"]') !== null ||
      target.closest('[data-slot="select-content"]') !== null ||
      target.closest('[data-slot="select-trigger"]') !== null ||
      target.closest('[data-rich-editor-portal]') !== null;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (containerRef.current?.contains(target)) return;
      if (isInsidePortal(target)) return;
      onExitEdit();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isEditing, onExitEdit]);

  // Esc closes the editor unless focus is currently inside a portal-rendered
  // popover (where Esc has its own meaning, e.g. closing the popover first).
  useEffect(() => {
    if (!isEditing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest('[data-slot="popover-content"]')) return;
      if (active?.closest('[data-slot="select-content"]')) return;
      if (active?.closest('[data-rich-editor-portal]')) return;
      event.preventDefault();
      onExitEdit();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isEditing, onExitEdit]);

  const onReadKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onEnterEdit();
    }
  };

  const motionInitial = reduceMotion ? false : { opacity: 0, y: 2 };
  const motionAnimate = { opacity: 1, y: 0 };
  const motionExit = reduceMotion ? { opacity: 0 } : { opacity: 0, y: -2 };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        {isEditing ? (
          <motion.div
            key="edit"
            initial={motionInitial}
            animate={motionAnimate}
            exit={motionExit}
            transition={TRANSITION}
            className="flex flex-col gap-3"
          >
            {editContent}
            <InlineEditorFooter
              onDone={onExitEdit}
              doneLabel={doneLabel}
              hintExitLabel={hintExitLabel}
            />
          </motion.div>
        ) : (
          <motion.div
            key="read"
            initial={motionInitial}
            animate={motionAnimate}
            exit={motionExit}
            transition={TRANSITION}
            className="group/inline relative"
          >
            <div
              tabIndex={0}
              role="button"
              aria-label={editAriaLabel}
              onClick={onEnterEdit}
              onKeyDown={onReadKeyDown}
              className={cn(
                'relative rounded-xl border border-transparent px-4 py-3 transition-colors',
                cursor === 'text' ? 'cursor-text' : 'cursor-pointer',
                'hover:border-border hover:bg-muted/30',
                'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40',
                readClassName,
              )}
            >
              {isEmpty ? emptyContent : readContent}
            </div>
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border',
                'opacity-0 translate-y-0.5 transition-all duration-150',
                'group-hover/inline:opacity-100 group-hover/inline:translate-y-0 group-focus-within/inline:opacity-100 group-focus-within/inline:translate-y-0',
              )}
            >
              <PencilIcon className="size-3" /> {editChipLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Convenience wrapper for the empty-state line — most inline editors want
 * the same look (muted small text + optional leading icon).
 */
export type InlineEditorEmptyProps = {
  text: string;
  icon?: ReactNode;
};

export function InlineEditorEmpty({ text, icon }: InlineEditorEmptyProps) {
  if (!icon) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    );
  }
  return (
    <p className="flex items-center gap-2 text-sm leading-relaxed text-muted-foreground">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

function InlineEditorFooter({
  onDone,
  doneLabel,
  hintExitLabel,
}: {
  onDone: () => void;
  doneLabel: string;
  hintExitLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Kbd>Esc</Kbd>
        <span>{hintExitLabel}</span>
      </span>
      <Button
        size="sm"
        onClick={onDone}
        className="h-8 gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
      >
        <CheckIcon className="size-3.5" /> {doneLabel}
      </Button>
    </div>
  );
}
