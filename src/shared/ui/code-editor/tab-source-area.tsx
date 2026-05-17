'use client';

import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';

import { CodeEditorPreview } from './code-editor-preview';
import { SOURCE_FLUSH_MS } from './constants';
import type { EditorTab } from './types';

/**
 * Handshake between the editor shell and the active-tab source area:
 * - ``takePending`` lifts the in-flight keystroke buffer out of the
 *   child and clears it WITHOUT committing. The shell folds the value
 *   into its single structural ``onTabsChange`` call so reorder /
 *   add / remove never trigger a double commit.
 * - ``flushNow`` is the self-contained commit path — used when the
 *   shell isn't doing a structural change (timer expiry, blur,
 *   unmount).
 */
export type FlushHandle = {
  takePending: () => string | null;
  flushNow: () => void;
};

export const NOOP_FLUSH_HANDLE: FlushHandle = {
  takePending: () => null,
  flushNow: () => {},
};

function applyAutofocus(
  textarea: HTMLTextAreaElement,
  position: 'start' | 'end',
) {
  textarea.focus({ preventScroll: true });
  const len = textarea.value.length;
  if (position === 'start') {
    textarea.setSelectionRange(0, 0);
  } else {
    textarea.setSelectionRange(len, len);
  }
}

type TabSourceAreaProps = {
  initialSource: string;
  previewLanguage: CodeLanguage;
  previewTabs: EditorTab[];
  previewActiveIndex: number;
  onCommit: (source: string) => void;
  registerFlush: (handle: FlushHandle) => void;
  autoFocus?: boolean | 'start' | 'end';
  placeholder: string;
  sourceAria: string;
  previewLabel: string;
  previewAria: string;
  textareaClassName?: string;
};

/**
 * Owns the active tab's keystroke buffer. The textarea is locally
 * controlled so each keystroke doesn't re-render the draft tree above
 * us; the buffer is pushed out via a micro-debounce, and exposed to
 * the parent via `registerFlush` so structural ops (language pick,
 * tab add/remove/rename) commit pending typing first.
 *
 * This component remounts whenever the active tab changes (via `key`
 * on the parent), so the buffer is always fresh for the active tab —
 * no ref-syncing in render.
 */
export function TabSourceArea({
  initialSource,
  previewLanguage,
  previewTabs,
  previewActiveIndex,
  onCommit,
  registerFlush,
  autoFocus,
  placeholder,
  sourceAria,
  previewLabel,
  previewAria,
  textareaClassName,
}: TabSourceAreaProps) {
  const [localSource, setLocalSource] = useState(initialSource);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const onCommitRef = useRef(onCommit);
  const lastCommittedRef = useRef(initialSource);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  // Pull the pending buffer out without committing — used by the
  // shell's structural ops to fold the latest keystrokes into a
  // single `onTabsChange` call (no double-render churn for dnd-kit).
  const takePending = useCallback((): string | null => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending === null) return null;
    if (pending === lastCommittedRef.current) return null;
    lastCommittedRef.current = pending;
    return pending;
  }, []);

  // Self-contained commit — used by the timer / blur / unmount paths
  // where there's no structural change for the value to ride along on.
  const flushNow = useCallback(() => {
    const pending = takePending();
    if (pending !== null) onCommitRef.current(pending);
  }, [takePending]);

  // Wire the handle up to the parent on mount; restore a no-op on
  // unmount so a stale ref can't fire after the active tab moved on.
  useEffect(() => {
    registerFlush({ takePending, flushNow });
    return () => registerFlush(NOOP_FLUSH_HANDLE);
  }, [registerFlush, takePending, flushNow]);

  // Flush on unmount — covers tab switch (when the key prop changes
  // for some other reason) and editor close (InlineEditorShell collapse).
  useEffect(() => {
    return () => {
      flushNow();
    };
  }, [flushNow]);

  // Auto-resize textarea to content.
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
  }, [localSource]);

  useEffect(() => {
    if (!autoFocus) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const id = requestAnimationFrame(() =>
      applyAutofocus(ta, autoFocus === 'start' ? 'start' : 'end'),
    );
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value;
      setLocalSource(next);
      pendingRef.current = next;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(flushNow, SOURCE_FLUSH_MS);
    },
    [flushNow],
  );

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Tab' || event.shiftKey) return;
      event.preventDefault();
      const ta = event.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = `${localSource.substring(0, start)}  ${localSource.substring(end)}`;
      setLocalSource(next);
      pendingRef.current = next;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      flushTimerRef.current = setTimeout(flushNow, SOURCE_FLUSH_MS);
      const caret = start + 2;
      requestAnimationFrame(() => {
        if (textareaRef.current !== ta) return;
        ta.setSelectionRange(caret, caret);
      });
    },
    [localSource, flushNow],
  );

  return (
    <>
      <textarea
        ref={textareaRef}
        value={localSource}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={flushNow}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        aria-label={sourceAria}
        className={cn(
          'block w-full resize-none overflow-hidden bg-background px-4 py-3 font-mono text-[13px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none',
          'min-h-[140px]',
          textareaClassName,
        )}
        rows={6}
      />

      <CodeEditorPreview
        tabs={previewTabs}
        activeIndex={previewActiveIndex}
        activeLanguage={previewLanguage}
        liveSource={localSource}
        previewLabel={previewLabel}
        ariaLabel={previewAria}
      />
    </>
  );
}
