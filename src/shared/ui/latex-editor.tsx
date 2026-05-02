'use client';

import { useTranslations } from 'next-intl';
import {
  type ChangeEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { MathView } from '@/shared/ui/math-view';
import { Separator } from '@/shared/ui/separator';

export type LatexEditorHandle = {
  /** Move keyboard focus to the source textarea. */
  focus: (position?: 'start' | 'end' | number) => void;
  /** The underlying textarea, exposed for advanced selection handling. */
  textarea: HTMLTextAreaElement | null;
  /** Replace the editor's value programmatically. */
  setValue: (value: string) => void;
};

export type LatexEditorProps = {
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  /** Render the live preview as a centered block (default) or inline. */
  displayMode?: boolean;
  /** Show the live KaTeX preview pane below the source. */
  showPreview?: boolean;
  autoFocus?: boolean | 'start' | 'end' | number;
};

type Snippet = {
  /** Visible label on the toolbar button. */
  label: ReactNode;
  /** Source inserted at the caret. */
  insert: string;
  /**
   * Cursor offset relative to the end of `insert`. Negative values move the
   * caret backwards (so `\\frac{}{}` with offset -3 lands inside the first
   * pair of braces, ready for the user to type the numerator).
   */
  cursorOffset: number;
  /** Aria-label / tooltip key. */
  i18nKey: string;
};

const SNIPPETS: ReadonlyArray<Snippet> = [
  { label: 'x²', insert: '^{}', cursorOffset: -1, i18nKey: 'superscript' },
  { label: 'xₙ', insert: '_{}', cursorOffset: -1, i18nKey: 'subscript' },
  { label: 'a⁄b', insert: '\\frac{}{}', cursorOffset: -3, i18nKey: 'fraction' },
  { label: '√', insert: '\\sqrt{}', cursorOffset: -1, i18nKey: 'sqrt' },
  { label: '∑', insert: '\\sum_{i=1}^{n} ', cursorOffset: 0, i18nKey: 'sum' },
  { label: '∫', insert: '\\int_{}^{} ', cursorOffset: -7, i18nKey: 'integral' },
  { label: 'lim', insert: '\\lim_{x \\to }', cursorOffset: -1, i18nKey: 'limit' },
  { label: '∞', insert: '\\infty ', cursorOffset: 0, i18nKey: 'infty' },
  { label: 'π', insert: '\\pi ', cursorOffset: 0, i18nKey: 'pi' },
  { label: '≤', insert: '\\le ', cursorOffset: 0, i18nKey: 'le' },
  { label: '≥', insert: '\\ge ', cursorOffset: 0, i18nKey: 'ge' },
  { label: '≠', insert: '\\neq ', cursorOffset: 0, i18nKey: 'neq' },
];

function applyAutofocus(
  textarea: HTMLTextAreaElement,
  position: NonNullable<LatexEditorProps['autoFocus']>,
) {
  textarea.focus({ preventScroll: true });
  const len = textarea.value.length;
  if (position === 'start') {
    textarea.setSelectionRange(0, 0);
  } else if (position === 'end' || position === true) {
    textarea.setSelectionRange(len, len);
  } else if (typeof position === 'number') {
    const pos = Math.max(0, Math.min(position, len));
    textarea.setSelectionRange(pos, pos);
  }
}

/**
 * Source editor for LaTeX — textarea with quick-insert toolbar and a live
 * KaTeX preview. Mirrors the UX shape of `RichEditor` so it can be embedded
 * inside an `InlineLatexEditor` or used standalone in a form.
 */
export const LatexEditor = forwardRef<LatexEditorHandle, LatexEditorProps>(
  function LatexEditor(
    {
      defaultValue = '',
      onChange,
      placeholder,
      className,
      editorClassName,
      displayMode = true,
      showPreview = true,
      autoFocus = false,
    },
    ref,
  ) {
    const t = useTranslations('latex-editor');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [value, setValue] = useState(defaultValue);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
      onChangeRef.current = onChange;
    }, [onChange]);

    useImperativeHandle(
      ref,
      () => ({
        focus: (position = 'end') => {
          const ta = textareaRef.current;
          if (!ta) return;
          applyAutofocus(ta, position);
        },
        get textarea() {
          return textareaRef.current;
        },
        setValue: (next: string) => {
          setValue(next);
          onChangeRef.current?.(next);
        },
      }),
      [],
    );

    useEffect(() => {
      if (!autoFocus) return;
      const ta = textareaRef.current;
      if (!ta) return;
      // Defer one frame so motion / popover entrance animations don't fight
      // the focus call.
      const id = requestAnimationFrame(() => applyAutofocus(ta, autoFocus));
      return () => cancelAnimationFrame(id);
    }, [autoFocus]);

    // Auto-resize: grow the textarea with its content (mirrors how the rich
    // editor expands as the user types). We reset to `auto` first so
    // `scrollHeight` reports the natural content height instead of being
    // clamped to whatever explicit height we set last frame.
    useEffect(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const update = () => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      };
      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, [value]);

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLTextAreaElement>) => {
        const next = event.target.value;
        setValue(next);
        onChangeRef.current?.(next);
      },
      [],
    );

    const insertSnippet = useCallback(
      (snippet: Snippet) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart ?? value.length;
        const end = ta.selectionEnd ?? value.length;
        const next =
          value.substring(0, start) + snippet.insert + value.substring(end);
        setValue(next);
        onChangeRef.current?.(next);
        const caret = start + snippet.insert.length + snippet.cursorOffset;
        // setSelectionRange must happen after React commits the new value to
        // the DOM, otherwise the textarea's value is still the old string.
        requestAnimationFrame(() => {
          if (textareaRef.current !== ta) return;
          ta.focus({ preventScroll: true });
          ta.setSelectionRange(caret, caret);
        });
      },
      [value],
    );

    return (
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-input bg-background transition-shadow',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40',
          className,
        )}
      >
        {/* Toolbar */}
        <div
          role="toolbar"
          aria-label={t('toolbarAria')}
          className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
        >
          {SNIPPETS.map((snippet, index) => (
            <button
              key={index}
              type="button"
              tabIndex={-1}
              onMouseDown={(event) => {
                // Keep textarea focus & avoid stealing it when toolbar is clicked.
                event.preventDefault();
              }}
              onClick={() => insertSnippet(snippet)}
              aria-label={t(`actions.${snippet.i18nKey}`)}
              title={t(`actions.${snippet.i18nKey}`)}
              className={cn(
                'inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              {snippet.label}
            </button>
          ))}
        </div>
        <Separator />

        {/* Source */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? t('placeholder')}
          spellCheck={false}
          aria-label={t('sourceAria')}
          className={cn(
            'block w-full resize-none overflow-hidden bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none',
            'min-h-[120px]',
            editorClassName,
          )}
          rows={4}
        />

        {/* Preview */}
        {showPreview ? (
          <>
            <Separator />
            <div className="flex flex-col gap-2 bg-muted/30 px-4 py-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('preview')}
              </span>
              <div className="min-h-8 overflow-x-auto">
                {value.trim() ? (
                  <MathView
                    tex={value}
                    displayMode={displayMode}
                    className={displayMode ? 'py-1' : undefined}
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t('previewEmpty')}
                  </span>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  },
);
