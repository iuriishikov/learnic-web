'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckIcon, ChevronDownIcon, PlusIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type CSSProperties,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { CodeBlock } from '@/shared/ui/code-block';
import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

const TAB_LABEL_MAX_LEN = 32;

export type EditorTab = {
  label: string;
  source: string;
  language: CodeLanguage;
};

type LanguageOption = {
  value: CodeLanguage;
  label: string;
};

type LanguageGroup = {
  heading: string;
  options: LanguageOption[];
};

const LANGUAGE_GROUPS: ReadonlyArray<LanguageGroup> = [
  {
    heading: 'js',
    options: [
      { value: 'tsx', label: 'TSX' },
      { value: 'ts', label: 'TypeScript' },
      { value: 'jsx', label: 'JSX' },
      { value: 'js', label: 'JavaScript' },
    ],
  },
  {
    heading: 'backend',
    options: [
      { value: 'python', label: 'Python' },
      { value: 'go', label: 'Go' },
      { value: 'rust', label: 'Rust' },
      { value: 'java', label: 'Java' },
      { value: 'kotlin', label: 'Kotlin' },
      { value: 'swift', label: 'Swift' },
      { value: 'php', label: 'PHP' },
      { value: 'ruby', label: 'Ruby' },
    ],
  },
  {
    heading: 'systems',
    options: [
      { value: 'c', label: 'C' },
      { value: 'cpp', label: 'C++' },
      { value: 'csharp', label: 'C#' },
    ],
  },
  {
    heading: 'web',
    options: [
      { value: 'html', label: 'HTML' },
      { value: 'xml', label: 'XML' },
      { value: 'css', label: 'CSS' },
      { value: 'scss', label: 'SCSS' },
    ],
  },
  {
    heading: 'data',
    options: [
      { value: 'json', label: 'JSON' },
      { value: 'yaml', label: 'YAML' },
      { value: 'toml', label: 'TOML' },
      { value: 'sql', label: 'SQL' },
      { value: 'graphql', label: 'GraphQL' },
    ],
  },
  {
    heading: 'markup',
    options: [{ value: 'markdown', label: 'Markdown' }],
  },
  {
    heading: 'shell',
    options: [
      { value: 'bash', label: 'Bash' },
      { value: 'sh', label: 'Shell' },
      { value: 'dockerfile', label: 'Dockerfile' },
    ],
  },
  {
    heading: 'other',
    options: [{ value: 'plain', label: 'Plain' }],
  },
];

const LANGUAGE_LOOKUP: Map<CodeLanguage, string> = new Map(
  LANGUAGE_GROUPS.flatMap((group) =>
    group.options.map((opt) => [opt.value, opt.label] as const),
  ),
);

export type CodeEditorProps = {
  /** Full tabs list — controlled. Always non-empty. */
  tabs: EditorTab[];
  /** Maximum number of tabs the parent will accept (defaults to 8). */
  maxTabs?: number;
  /** Fired with the new tabs list on every change (add / rename / type / delete / language pick). */
  onTabsChange: (tabs: EditorTab[]) => void;
  /** Auto-focus the active tab's source area on mount. */
  autoFocus?: boolean | 'start' | 'end';
  className?: string;
  textareaClassName?: string;
};

const DEFAULT_MAX_TABS = 8;

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

/**
 * Source editor for the `CodeBlock` content type — multi-tab aware.
 *
 * Layout:
 *  - Top strip: tab list (rename inline) + per-tab close + "+ tab" button.
 *  - Middle: monospace source textarea for the active tab, Tab key indents.
 *  - Right rail of the strip: language picker (DropdownMenu, grouped).
 *  - Bottom: live preview that mirrors the read-mode `CodeBlock` (with tabs
 *    if multi-tab, single block if single-tab).
 *
 * The component is fully controlled by `tabs` + `onTabsChange`; only the
 * "active tab" index is local state since it's a UI concern.
 */
export function CodeEditor({
  tabs,
  maxTabs = DEFAULT_MAX_TABS,
  onTabsChange,
  autoFocus,
  className,
  textareaClassName,
}: CodeEditorProps) {
  const t = useTranslations('code-block.editor');
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(tabs.length - 1, 0));
  const activeTab = tabs[safeIndex];

  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(
    null,
  );

  // The active tab's source is owned by `<TabSourceArea>` (a child).
  // Structural ops (language pick, reorder, add/remove/rename) call
  // `takePending()` to lift the in-flight keystroke buffer out of the
  // child WITHOUT triggering its own commit, then fold the pending
  // source into a single `onTabsChange` call alongside the structural
  // change. This avoids two sequential commits per drop, which used
  // to make dnd-kit re-animate twice and the textarea remount with a
  // miscalculated height.
  const flushSourceRef = useRef<FlushHandle>(NOOP_FLUSH_HANDLE);
  const tabsRef = useRef(tabs);
  const onTabsChangeRef = useRef(onTabsChange);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    tabsRef.current = tabs;
  }, [tabs]);

  useEffect(() => {
    onTabsChangeRef.current = onTabsChange;
  }, [onTabsChange]);

  useEffect(() => {
    activeIndexRef.current = safeIndex;
  }, [safeIndex]);

  const commitTab = useCallback(
    (index: number, patch: Partial<EditorTab>) => {
      const current = tabsRef.current;
      onTabsChangeRef.current(
        current.map((tab, i) => (i === index ? { ...tab, ...patch } : tab)),
      );
    },
    [],
  );

  const flushAndCommit = useCallback(
    (build: (current: EditorTab[]) => EditorTab[]) => {
      // Take the pending keystroke buffer out of the child first;
      // fold it into the active tab BEFORE the structural transform,
      // so we make exactly one `onTabsChange` call carrying both.
      const pending = flushSourceRef.current.takePending();
      let base = tabsRef.current;
      if (pending !== null) {
        const idx = activeIndexRef.current;
        if (idx >= 0 && idx < base.length) {
          base = base.map((tab, i) =>
            i === idx ? { ...tab, source: pending } : tab,
          );
        }
      }
      onTabsChangeRef.current(build(base));
    },
    [],
  );

  const handleLanguageChange = useCallback(
    (language: CodeLanguage) => {
      // Route through `flushAndCommit` so any in-flight keystroke
      // buffer is folded into the same `onTabsChange` call as the
      // language pick (single render, no double-commit).
      flushAndCommit((current) =>
        current.map((tab, i) =>
          i === activeIndexRef.current ? { ...tab, language } : tab,
        ),
      );
    },
    [flushAndCommit],
  );

  const handleLabelChange = useCallback(
    (index: number, label: string) => {
      flushAndCommit((current) =>
        current.map((tab, i) =>
          i === index
            ? { ...tab, label: label.slice(0, TAB_LABEL_MAX_LEN) }
            : tab,
        ),
      );
    },
    [flushAndCommit],
  );

  const handleActiveTabSourceChange = useCallback(
    (source: string) => {
      // The child has already committed its buffer; we just write it
      // through. We use `commitTab` (no flush) since the child IS the
      // flush.
      commitTab(safeIndex, { source });
    },
    [safeIndex, commitTab],
  );

  const registerFlush = useCallback((handle: FlushHandle) => {
    flushSourceRef.current = handle;
  }, []);

  const addTab = useCallback(() => {
    if (tabsRef.current.length >= maxTabs) return;
    flushAndCommit((current) => {
      const next: EditorTab[] = [...current];
      // First promotion to multi-tab needs the existing tab to acquire
      // a real label — empty labels are only valid in the single-tab
      // case.
      if (next.length === 1 && !next[0].label) {
        next[0] = { ...next[0], label: t('defaultTabLabel', { index: 1 }) };
      }
      next.push({
        label: t('defaultTabLabel', { index: next.length + 1 }),
        source: '',
        language: next[next.length - 1]?.language ?? 'plain',
      });
      // Schedule the activeIndex update *after* the parent commits so
      // the textarea remounts against the new tab; setting state from
      // an event handler is safe.
      queueMicrotask(() => {
        setActiveIndex(next.length - 1);
        setEditingLabelIndex(next.length - 1);
      });
      return next;
    });
  }, [maxTabs, t, flushAndCommit]);

  const removeTab = useCallback(
    (index: number) => {
      if (tabsRef.current.length <= 1) return;
      flushAndCommit((current) => {
        const next = current.filter((_, i) => i !== index);
        if (next.length === 1) {
          next[0] = { ...next[0], label: '' };
        }
        return next;
      });
      setActiveIndex((curr) => {
        if (index < curr) return curr - 1;
        if (index === curr) return Math.max(0, curr - 1);
        return curr;
      });
    },
    [flushAndCommit],
  );

  const reorderTabs = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;
      flushAndCommit((current) => arrayMove(current, oldIndex, newIndex));
      // Track the active tab through the reorder so the user keeps
      // looking at the same content. Three cases:
      //  - dragged the active tab → activeIndex follows it.
      //  - reorder happened *across* the active tab (oldIndex and
      //    newIndex straddle it) → it shifts by one in the opposite
      //    direction.
      //  - both indices on the same side → activeIndex unchanged.
      setActiveIndex((curr) => {
        if (curr === oldIndex) return newIndex;
        if (oldIndex < curr && newIndex >= curr) return curr - 1;
        if (oldIndex > curr && newIndex <= curr) return curr + 1;
        return curr;
      });
    },
    [flushAndCommit],
  );

  if (!activeTab) return null;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-input bg-background transition-shadow',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/30 px-2 py-1.5">
        <TabsStrip
          tabs={tabs}
          activeIndex={safeIndex}
          editingLabelIndex={editingLabelIndex}
          onSelect={setActiveIndex}
          onStartRename={(index) => {
            setActiveIndex(index);
            setEditingLabelIndex(index);
          }}
          onCommitRename={(index, label) => {
            handleLabelChange(index, label);
            setEditingLabelIndex(null);
          }}
          onCancelRename={() => setEditingLabelIndex(null)}
          onRemove={removeTab}
          onReorder={reorderTabs}
          canAdd={tabs.length < maxTabs}
          onAdd={addTab}
          addAriaLabel={t('addTab')}
          removeAriaLabel={t('removeTab')}
          renameAriaLabel={t('renameTab')}
          reorderAriaLabel={t('reorderTab')}
        />

        <LanguagePicker
          value={activeTab.language}
          onChange={handleLanguageChange}
        />
      </div>

      <TabSourceArea
        // Key by tab IDENTITY, not position. After a reorder the
        // active tab moves to a different `safeIndex` but its label
        // (the dnd-kit ID, guaranteed unique within multi-tab) stays
        // the same — so the textarea persists, no remount, no
        // auto-resize re-measure flicker. Single-tab blocks have an
        // empty label by convention; we fall back to a sentinel so
        // the key is always non-empty.
        key={activeTab.label || '__single__'}
        initialSource={activeTab.source}
        previewLanguage={activeTab.language}
        previewTabs={tabs}
        previewActiveIndex={safeIndex}
        onCommit={handleActiveTabSourceChange}
        registerFlush={registerFlush}
        autoFocus={autoFocus}
        placeholder={t('placeholder')}
        sourceAria={t('sourceAria')}
        previewLabel={t('preview')}
        previewAria={t('previewAria')}
        textareaClassName={textareaClassName}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Active-tab source area — owns its keystroke buffer locally                 */
/* -------------------------------------------------------------------------- */

// Keystroke flush cadence — small enough to feel instantaneous (<= one
// frame on a fast machine), large enough to coalesce a typing burst into
// one parent commit. Tuned by hand; not user-visible as a prop.
const SOURCE_FLUSH_MS = 220;

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
type FlushHandle = {
  takePending: () => string | null;
  flushNow: () => void;
};

const NOOP_FLUSH_HANDLE: FlushHandle = {
  takePending: () => null,
  flushNow: () => {},
};

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
function TabSourceArea({
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

/* -------------------------------------------------------------------------- */
/* Preview                                                                    */
/* -------------------------------------------------------------------------- */

type CodeEditorPreviewProps = {
  tabs: EditorTab[];
  activeIndex: number;
  activeLanguage: CodeLanguage;
  liveSource: string;
  previewLabel: string;
  ariaLabel: string;
};

/**
 * Live syntax-highlighted preview, deferred so it never competes with
 * keystrokes. We render against a deferred copy of `liveSource` (and a
 * memoized tabs list that overlays it onto the active tab) so React
 * gets to commit the textarea synchronously and re-tokenise the
 * preview during idle time.
 */
function CodeEditorPreview({
  tabs,
  activeIndex,
  activeLanguage,
  liveSource,
  previewLabel,
  ariaLabel,
}: CodeEditorPreviewProps) {
  const deferredSource = useDeferredValue(liveSource);
  const previewTabs = useMemo(
    () =>
      tabs.map((tab, i) =>
        i === activeIndex ? { ...tab, source: deferredSource } : tab,
      ),
    [tabs, activeIndex, deferredSource],
  );

  const hasContent = previewTabs.some(
    (tab) => tab.source.trim().length > 0,
  );
  if (!hasContent) return null;

  const hasMultipleTabs = previewTabs.length > 1;

  return (
    <div className="border-t border-border bg-muted/30 px-3 py-3">
      <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {previewLabel}
      </p>
      {hasMultipleTabs ? (
        <CodeBlock
          tabs={previewTabs.map((tab, i) => ({
            label: tab.label || tab.language,
            value: `${tab.label}__${i}`,
            code: tab.source,
            language: tab.language,
          }))}
          showLineNumbers
          ariaLabel={ariaLabel}
        />
      ) : (
        <CodeBlock
          code={deferredSource}
          language={activeLanguage}
          showLineNumbers
          ariaLabel={ariaLabel}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tab strip                                                                  */
/* -------------------------------------------------------------------------- */

type TabsStripProps = {
  tabs: EditorTab[];
  activeIndex: number;
  editingLabelIndex: number | null;
  onSelect: (index: number) => void;
  onStartRename: (index: number) => void;
  onCommitRename: (index: number, label: string) => void;
  onCancelRename: () => void;
  onRemove: (index: number) => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  canAdd: boolean;
  onAdd: () => void;
  addAriaLabel: string;
  removeAriaLabel: string;
  renameAriaLabel: string;
  reorderAriaLabel: string;
};

function TabsStrip({
  tabs,
  activeIndex,
  editingLabelIndex,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onRemove,
  onReorder,
  canAdd,
  onAdd,
  addAriaLabel,
  removeAriaLabel,
  renameAriaLabel,
  reorderAriaLabel,
}: TabsStripProps) {
  const showTabs = tabs.length > 1;

  // dnd-kit only kicks in for multi-tab — single-tab blocks have nothing
  // to reorder, and unique non-empty labels (used as item IDs below) are
  // a multi-tab invariant anyway.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // 6px activation distance lets onClick on the pill button still
      // fire normally; only an actual drag gesture flips into reorder.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tabIds = useMemo(() => tabs.map((tab) => tab.label), [tabs]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = tabs.findIndex((t) => t.label === active.id);
      const newIndex = tabs.findIndex((t) => t.label === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onReorder(oldIndex, newIndex);
    },
    [tabs, onReorder],
  );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {showTabs ? (
        <DndContext
          id="code-tabs-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tabIds}
            strategy={horizontalListSortingStrategy}
          >
            <ul className="flex min-w-0 flex-wrap items-center gap-1">
              {tabs.map((tab, index) => (
                <li key={tab.label} className="flex items-center">
                  <TabPill
                    dndId={tab.label}
                    label={tab.label}
                    isActive={index === activeIndex}
                    isEditing={index === editingLabelIndex}
                    onSelect={() => onSelect(index)}
                    onStartRename={() => onStartRename(index)}
                    onCommit={(value) => onCommitRename(index, value)}
                    onCancel={onCancelRename}
                    onRemove={() => onRemove(index)}
                    removeAriaLabel={removeAriaLabel}
                    renameAriaLabel={renameAriaLabel}
                    reorderAriaLabel={reorderAriaLabel}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}

      {canAdd ? (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addAriaLabel}
          title={addAriaLabel}
          className={cn(
            'inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-dashed border-border px-2 text-[12px] font-medium text-muted-foreground transition-colors',
            'hover:border-brand/60 hover:bg-brand/5 hover:text-brand',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          <PlusIcon className="size-3.5" />
          {showTabs ? null : (
            <span className="text-[11px] uppercase tracking-wider">
              {addAriaLabel}
            </span>
          )}
        </button>
      ) : null}
    </div>
  );
}

type TabPillProps = {
  dndId: string;
  label: string;
  isActive: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommit: (label: string) => void;
  onCancel: () => void;
  onRemove?: () => void;
  removeAriaLabel: string;
  renameAriaLabel: string;
  reorderAriaLabel: string;
};

function TabPill({
  dndId,
  label,
  isActive,
  isEditing,
  onSelect,
  onStartRename,
  onCommit,
  onCancel,
  onRemove,
  removeAriaLabel,
  renameAriaLabel,
  reorderAriaLabel,
}: TabPillProps) {
  // The whole pill is the drag handle (Chrome-tabs style). Activation
  // distance on the parent's PointerSensor (6px) lets onClick on the
  // inner button still fire — only a real drag gesture starts a sort.
  // Drag is suppressed while renaming so the input gets normal focus.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: dndId, disabled: isEditing });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      // The pill is a flex container; drag affordances live on the
      // outer wrapper so listeners cover label + close button alike.
      // `cursor-grab` switches to `grabbing` mid-drag; on focus we
      // signal that keyboard reorder is available via `aria-roledescription`.
      aria-roledescription={reorderAriaLabel}
      className={cn(
        'group/tab inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
          : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
        isEditing
          ? 'cursor-text'
          : 'cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'opacity-80 shadow-md ring-1 ring-brand/40',
      )}
    >
      {isEditing ? (
        <RenameTabInput
          initialValue={label}
          onCommit={onCommit}
          onCancel={onCancel}
          ariaLabel={renameAriaLabel}
        />
      ) : (
        <button
          type="button"
          onClick={isActive ? onStartRename : onSelect}
          onDoubleClick={onStartRename}
          title={isActive ? renameAriaLabel : label}
          className="cursor-[inherit] font-mono"
        >
          {label || '—'}
        </button>
      )}

      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            // Stop the click from bubbling to the pill's drag-aware
            // listeners — without this, dnd-kit can interpret a quick
            // mousedown-on-X as the start of a sort.
            e.stopPropagation();
            onRemove();
          }}
          // Stop pointer events too: the PointerSensor listens on
          // pointerdown, which fires before click — we don't want it
          // to engage when the user is clearly aiming at the X.
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={removeAriaLabel}
          title={removeAriaLabel}
          className={cn(
            'inline-flex size-4 cursor-pointer items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100',
            'hover:bg-destructive/10 hover:text-destructive',
            isActive && 'opacity-60',
          )}
        >
          <XIcon className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

type RenameTabInputProps = {
  initialValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  ariaLabel: string;
};

/**
 * Isolated rename input — mounted only while a tab is being renamed,
 * so seeding state from the current label happens via `useState`'s
 * lazy initializer rather than an effect that watches props.
 */
function RenameTabInput({
  initialValue,
  onCommit,
  onCancel,
  ariaLabel,
}: RenameTabInputProps) {
  const [draft, setDraft] = useState(initialValue);

  // Auto-focus on mount. Pure side-effect (touches the DOM, no React
  // state), so the lint rule against setState-in-effect doesn't apply.
  const onMountRef = useCallback((node: HTMLInputElement | null) => {
    if (!node) return;
    requestAnimationFrame(() => {
      node.focus();
      node.select();
    });
  }, []);

  return (
    <input
      ref={onMountRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value.slice(0, TAB_LABEL_MAX_LEN))}
      onBlur={() => onCommit(draft.trim() || initialValue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommit(draft.trim() || initialValue);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancel();
        }
      }}
      maxLength={TAB_LABEL_MAX_LEN}
      aria-label={ariaLabel}
      className="h-5 w-24 rounded bg-transparent px-1 font-mono text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Language picker                                                            */
/* -------------------------------------------------------------------------- */

type LanguagePickerProps = {
  value: CodeLanguage;
  onChange: (next: CodeLanguage) => void;
};

function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const t = useTranslations('code-block.editor');
  const triggerId = useId();
  const label = LANGUAGE_LOOKUP.get(value) ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            id={triggerId}
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t('languageAria')}
            className={cn(
              'h-7 shrink-0 gap-1.5 rounded-md border border-transparent px-2 text-[12px] font-medium text-muted-foreground',
              'hover:border-border hover:bg-background hover:text-foreground',
              'data-[state=open]:border-border data-[state=open]:bg-background data-[state=open]:text-foreground',
            )}
          />
        }
      >
        <LanguageDot language={value} />
        <span className="font-mono">{label}</span>
        <ChevronDownIcon className="size-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56 p-1">
        {LANGUAGE_GROUPS.map((group, idx) => (
          <DropdownMenuGroup key={group.heading}>
            {idx > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="px-2 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(`languageGroup.${group.heading}`)}
            </DropdownMenuLabel>
            {group.options.map((opt) => {
              const isActive = opt.value === value;
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={cn(
                    'group/lang flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]',
                    isActive && 'bg-brand/10 text-brand',
                  )}
                >
                  <LanguageDot language={opt.value} />
                  <span className="flex-1 font-mono">{opt.label}</span>
                  <AnimatePresence>
                    {isActive ? (
                      <motion.span
                        key="check"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.12 }}
                        aria-hidden
                      >
                        <CheckIcon className="size-3.5 text-brand" />
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Language brand colours — GitHub Linguist palette (close to). Keep in
// sync with `CodeLanguage` so the picker, the tab strip, and any future
// "language badge" all read from one source.
const LANGUAGE_DOT_CLASSES: Record<CodeLanguage, string> = {
  tsx: 'bg-[#3178c6]',
  ts: 'bg-[#3178c6]',
  jsx: 'bg-[#f7df1e]',
  js: 'bg-[#f7df1e]',
  python: 'bg-[#3572a5]',
  go: 'bg-[#00add8]',
  rust: 'bg-[#dea584]',
  java: 'bg-[#b07219]',
  kotlin: 'bg-[#a97bff]',
  swift: 'bg-[#fa7343]',
  php: 'bg-[#787cb5]',
  ruby: 'bg-[#cc342d]',
  c: 'bg-[#555555]',
  cpp: 'bg-[#f34b7d]',
  csharp: 'bg-[#178600]',
  html: 'bg-[#e34c26]',
  xml: 'bg-[#0060ac]',
  css: 'bg-[#563d7c]',
  scss: 'bg-[#c6538c]',
  json: 'bg-[#9ca3af]',
  yaml: 'bg-[#cb171e]',
  toml: 'bg-[#9c4221]',
  sql: 'bg-[#e38c00]',
  graphql: 'bg-[#e10098]',
  markdown: 'bg-[#083fa1]',
  bash: 'bg-[#4eaa25]',
  sh: 'bg-[#4eaa25]',
  dockerfile: 'bg-[#384d54]',
  plain: 'bg-muted-foreground/40',
};

function LanguageDot({ language }: { language: CodeLanguage }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        LANGUAGE_DOT_CLASSES[language],
      )}
    />
  );
}
