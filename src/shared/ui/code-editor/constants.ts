import type { CodeLanguage } from '@/shared/ui/code-block-tokenize';

export const TAB_LABEL_MAX_LEN = 32;
export const DEFAULT_MAX_TABS = 8;
// Keystroke flush cadence — small enough to feel instantaneous (<= one
// frame on a fast machine), large enough to coalesce a typing burst into
// one parent commit. Tuned by hand; not user-visible as a prop.
export const SOURCE_FLUSH_MS = 220;

export type LanguageOption = {
  value: CodeLanguage;
  label: string;
};

export type LanguageGroup = {
  heading: string;
  options: LanguageOption[];
};

export const LANGUAGE_GROUPS: ReadonlyArray<LanguageGroup> = [
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

export const LANGUAGE_LOOKUP: Map<CodeLanguage, string> = new Map(
  LANGUAGE_GROUPS.flatMap((group) =>
    group.options.map((opt) => [opt.value, opt.label] as const),
  ),
);

// Language brand colours — GitHub Linguist palette (close to). Keep in
// sync with `CodeLanguage` so the picker, the tab strip, and any future
// "language badge" all read from one source.
export const LANGUAGE_DOT_CLASSES: Record<CodeLanguage, string> = {
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
