export type LessonBlockType = 'html' | 'katex' | 'rutube_video' | 'code';

// Mirror of the backend `CodeBlockLanguage` enum and the frontend
// `code-block-tokenize` supported set — keep these in sync.
export type CodeBlockLanguage =
  // JS / TS family
  | 'tsx'
  | 'ts'
  | 'jsx'
  | 'js'
  // Backend
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'kotlin'
  | 'swift'
  | 'php'
  | 'ruby'
  // Systems
  | 'c'
  | 'cpp'
  | 'csharp'
  // Web markup / styles
  | 'html'
  | 'xml'
  | 'css'
  | 'scss'
  // Data / config
  | 'json'
  | 'yaml'
  | 'toml'
  | 'sql'
  | 'graphql'
  // Markup
  | 'markdown'
  // Shell
  | 'bash'
  | 'sh'
  | 'dockerfile'
  // Fallback
  | 'plain';

export const CODE_BLOCK_LANGUAGES: readonly CodeBlockLanguage[] = [
  'tsx',
  'ts',
  'jsx',
  'js',
  'python',
  'go',
  'rust',
  'java',
  'kotlin',
  'swift',
  'php',
  'ruby',
  'c',
  'cpp',
  'csharp',
  'html',
  'xml',
  'css',
  'scss',
  'json',
  'yaml',
  'toml',
  'sql',
  'graphql',
  'markdown',
  'bash',
  'sh',
  'dockerfile',
  'plain',
];

export type HtmlBlock = {
  type: 'html';
  id: string;
  position: number;
  html: string;
};

export type KatexBlock = {
  type: 'katex';
  id: string;
  position: number;
  source: string;
};

export type RutubeVideoBlock = {
  type: 'rutube_video';
  id: string;
  position: number;
  externalId: string;
  embedUrl: string;
  title: string | null;
};

export type CodeTab = {
  label: string;
  source: string;
  language: CodeBlockLanguage;
};

export type CodeBlock = {
  type: 'code';
  id: string;
  position: number;
  tabs: CodeTab[];
};

// Domain limits — keep in sync with the backend constants.
export const CODE_TAB_LABEL_MAX_LEN = 32;
export const CODE_BLOCK_MAX_TABS = 8;

export type LessonBlock =
  | HtmlBlock
  | KatexBlock
  | RutubeVideoBlock
  | CodeBlock;

export type DraftLesson = {
  id: string;
  title: string;
  position: number;
  blocks: LessonBlock[];
};

export type DraftModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: DraftLesson[];
};

export type CourseDraft = {
  courseId: string;
  fetchedAt: string;
  modules: DraftModule[];
};
