'use client';

import { CodeIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { CodeBlock } from '@/shared/ui/code-block';
import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';
import { CodeEditor, type EditorTab } from '@/shared/ui/code-editor';
import {
  InlineEditorEmpty,
  InlineEditorShell,
} from '@/shared/ui/inline-editor';

export type InlineCodeTab = {
  label: string;
  source: string;
  language: CodeLanguage;
};

export type InlineCodeEditorProps = {
  /** Current tabs — always at least one entry. */
  tabs: InlineCodeTab[];
  /** Maximum number of tabs the parent will accept. */
  maxTabs?: number;
  /** Fires whenever any tab field (source / label / language / count) changes. */
  onTabsChange: (tabs: InlineCodeTab[]) => void;
  /** Read-mode placeholder when every tab's source is blank. */
  emptyText?: string;
  className?: string;
};

function isBlank(tabs: InlineCodeTab[]): boolean {
  return tabs.every((t) => !t.source || t.source.trim().length === 0);
}

/**
 * Read-only syntax-highlighted preview by default; on click / Enter / Space
 * the block morphs into a full `CodeEditor` with the tab strip + language
 * picker. Inherits the shared inline-edit chrome (Esc / click-outside,
 * Done footer).
 *
 * For multi-tab blocks the read mode renders the `CodeBlock` viewer with
 * its own tab strip; for single-tab blocks the strip is hidden entirely.
 */
export function InlineCodeEditor({
  tabs,
  maxTabs,
  onTabsChange,
  emptyText,
  className,
}: InlineCodeEditorProps) {
  const t = useTranslations('code-block.inline');
  const [isEditing, setIsEditing] = useState(false);

  const enterEdit = useCallback(() => setIsEditing(true), []);
  const exitEdit = useCallback(() => setIsEditing(false), []);

  const empty = isBlank(tabs);

  return (
    <InlineEditorShell
      isEditing={isEditing}
      onEnterEdit={enterEdit}
      onExitEdit={exitEdit}
      isEmpty={empty}
      emptyContent={
        <InlineEditorEmpty
          text={emptyText ?? t('emptyState')}
          icon={<CodeIcon className="size-4" />}
        />
      }
      readContent={renderRead(tabs, t('readAria'))}
      editContent={
        <CodeEditor
          tabs={tabs as EditorTab[]}
          maxTabs={maxTabs}
          onTabsChange={(next) => onTabsChange(next as InlineCodeTab[])}
          autoFocus="end"
        />
      }
      editAriaLabel={t('editAria')}
      editChipLabel={t('editLabel')}
      doneLabel={t('done')}
      hintExitLabel={t('hintExit')}
      readClassName={
        empty
          ? undefined
          : 'p-0 hover:border-transparent hover:bg-transparent [&~span]:hidden'
      }
      className={className}
    />
  );
}

function renderRead(tabs: InlineCodeTab[], ariaLabel: string) {
  if (tabs.length > 1) {
    return (
      <CodeBlock
        tabs={tabs.map((tab, idx) => ({
          label: tab.label || tab.language,
          value: `${tab.label}__${idx}`,
          code: tab.source,
          language: tab.language,
        }))}
        showLineNumbers
        ariaLabel={ariaLabel}
      />
    );
  }
  const only = tabs[0];
  return (
    <CodeBlock
      code={only.source}
      language={only.language}
      showLineNumbers
      ariaLabel={ariaLabel}
    />
  );
}
