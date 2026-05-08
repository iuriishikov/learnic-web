'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  InlineEditorEmpty,
  InlineEditorShell,
} from '@/shared/ui/inline-editor';
import { LatexEditor } from '@/shared/ui/latex-editor';
import { MathView } from '@/shared/ui/math-view';

export type InlineLatexEditorProps = {
  /** Current LaTeX source. */
  value: string;
  /** Fires on every keystroke inside the editor. */
  onChange: (tex: string) => void;
  /** Source-textarea placeholder. */
  placeholder?: string;
  /** Shown in read mode when `value` is blank. */
  emptyText?: string;
  /** Block (centered, default) vs inline math rendering. */
  displayMode?: boolean;
  className?: string;
};

// LaTeX commands that produce horizontal spacing only — used as the empty
// placeholder for newly-created KaTeX blocks (the server rejects whitespace-
// only source). Treat a value made entirely of these as blank so the editor
// still shows the "click to add formula" prompt for a fresh block.
const LATEX_SPACING_COMMANDS = /\\(?:[,;:!]|quad|qquad|hspace\{[^}]*\}|\s)/g;

function isBlank(value: string | undefined): boolean {
  if (!value) return true;
  return !value.replace(LATEX_SPACING_COMMANDS, '').trim();
}

/**
 * Read-only KaTeX rendering by default; on click / Enter / Space the block
 * morphs into a `LatexEditor` with autofocus on the source textarea.
 *
 * Behaviour and chrome (hover chip, Esc/Done footer, popLayout transition)
 * are inherited from `InlineEditorShell` so this component stays focused on
 * the LaTeX-specific bits: rendering math via `MathView` in read mode and
 * mounting the source `LatexEditor` in edit mode.
 */
export function InlineLatexEditor({
  value,
  onChange,
  placeholder,
  emptyText,
  displayMode = true,
  className,
}: InlineLatexEditorProps) {
  const t = useTranslations('latex-editor.inline');
  const [isEditing, setIsEditing] = useState(false);

  const enterEdit = useCallback(() => setIsEditing(true), []);
  const exitEdit = useCallback(() => setIsEditing(false), []);

  const empty = isBlank(value);

  return (
    <InlineEditorShell
      isEditing={isEditing}
      onEnterEdit={enterEdit}
      onExitEdit={exitEdit}
      isEmpty={empty}
      emptyContent={
        <InlineEditorEmpty text={emptyText ?? t('emptyState')} />
      }
      readContent={
        <MathView
          tex={value}
          displayMode={displayMode}
          className={cn(
            'overflow-x-auto',
            displayMode ? 'py-1' : undefined,
          )}
        />
      }
      editContent={
        <LatexEditor
          defaultValue={value}
          onChange={onChange}
          placeholder={placeholder}
          displayMode={displayMode}
          autoFocus="end"
        />
      }
      editAriaLabel={t('editAria')}
      editChipLabel={t('editLabel')}
      doneLabel={t('done')}
      hintExitLabel={t('hintExit')}
      className={className}
    />
  );
}
