'use client';

import { arrayMove } from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';

import {
  DEFAULT_MAX_TABS,
  TAB_LABEL_MAX_LEN,
} from './constants';
import { LanguagePicker } from './language-picker';
import {
  type FlushHandle,
  NOOP_FLUSH_HANDLE,
  TabSourceArea,
} from './tab-source-area';
import { TabsStrip } from './tabs-strip';
import type { CodeEditorProps, EditorTab } from './types';

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
