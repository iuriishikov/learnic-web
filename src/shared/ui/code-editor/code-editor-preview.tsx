'use client';

import { useDeferredValue, useMemo } from 'react';

import { CodeBlock } from '@/shared/ui/code-block';
import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';

import type { EditorTab } from './types';

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
export function CodeEditorPreview({
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

  const hasContent = previewTabs.some((tab) => tab.source.trim().length > 0);
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
