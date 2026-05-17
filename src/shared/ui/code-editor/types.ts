import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';

export type EditorTab = {
  label: string;
  source: string;
  language: CodeLanguage;
};

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
