import type { ApiFile } from '@/shared/types/user';

export type LessonBlockType =
  | 'html'
  | 'katex'
  | 'rutube_video'
  | 'code'
  | 'single_choice'
  | 'multi_choice'
  | 'text_input'
  | 'file'
  | 'video_file'
  | 'photo_collage';

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

// Interactive answer block limits — keep in sync with the backend
// constants under `entities/note_block/constants.py`.
export const CHOICE_OPTION_LABEL_MAX_LEN = 200;
export const CHOICE_BLOCK_MIN_OPTIONS = 2;
export const CHOICE_BLOCK_MAX_OPTIONS = 8;
export const TEXT_INPUT_ANSWER_MAX_LEN = 500;
export const TEXT_INPUT_MIN_ACCEPTED = 1;
export const TEXT_INPUT_MAX_ACCEPTED = 10;

export type ChoiceOption = {
  oid: string;
  label: string;
};

// Single- and multi-choice carry the same shape on the wire; the
// difference is whether one option is correct (single) or a non-
// empty subset is (multi). Stored as a string array of option ids
// for consistency with the backend's JSONB representation.
export type SingleChoiceBlock = {
  type: 'single_choice';
  id: string;
  position: number;
  options: ChoiceOption[];
  // ``correctOptionId`` is included on the authoring view (the
  // author needs to see what they configured). It is NEVER present
  // on the student-facing public view served from the release
  // content endpoint — the backend strips it at the HTTP boundary.
  correctOptionId: string;
};

export type MultiChoiceBlock = {
  type: 'multi_choice';
  id: string;
  position: number;
  options: ChoiceOption[];
  correctOptionIds: string[];
};

export type TextInputBlock = {
  type: 'text_input';
  id: string;
  position: number;
  // Author-side: full accepted-answer list visible. Public view
  // strips this; only ``caseSensitive`` / ``trimWhitespace`` are
  // exposed to the learner so the UI can hint at normalisation.
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
};

// File-backed block limits — keep in sync with the backend's
// `entities/note_block/constants.py`. Title is shared across all
// three file-backed types.
export const BLOCK_TITLE_MAX_LEN = 200;
export const PHOTO_COLLAGE_CAPTION_MAX_LEN = 280;
export const PHOTO_COLLAGE_MIN_ITEMS = 1;
export const PHOTO_COLLAGE_MAX_ITEMS = 12;

// Per-upload size caps — mirror
// `presentation/http/common/upload_limits.py`. Treated as the
// authoritative client-side limit so the dialog can reject oversized
// files before they hit the network. When the backend value changes,
// these must change too — the server still re-validates.
const _MB = 1024 * 1024;
export const LESSON_FILE_BLOCK_MAX_BYTES = 50 * _MB;
export const LESSON_VIDEO_BLOCK_MAX_BYTES = 1024 * _MB;
export const LESSON_COLLAGE_ITEM_MAX_BYTES = 80 * _MB;

export type FileBlock = {
  type: 'file';
  id: string;
  position: number;
  // `null` when the backing file was purged after the block was
  // created (`ON DELETE SET NULL` on the FK). The viewer renders a
  // "file missing" placeholder for those rows. When present, the
  // nested ApiFile carries a short-lived presigned URL.
  file: ApiFile | null;
  title: string | null;
};

export type VideoFileBlock = {
  type: 'video_file';
  id: string;
  position: number;
  file: ApiFile | null;
  title: string | null;
};

export type CollageItem = {
  // Stable identity minted by the backend. Used as the React key and
  // as the `itemId` path parameter on the per-item mutation endpoints
  // (remove / caption update). Items added optimistically before the
  // server response carry a temp string id; the cache replace from
  // the POST response swaps it for the real UUID.
  oid: string;
  file: ApiFile | null;
  caption: string | null;
};

export type PhotoCollageBlock = {
  type: 'photo_collage';
  id: string;
  position: number;
  items: CollageItem[];
  title: string | null;
};

export type LessonBlock =
  | HtmlBlock
  | KatexBlock
  | RutubeVideoBlock
  | CodeBlock
  | SingleChoiceBlock
  | MultiChoiceBlock
  | TextInputBlock
  | FileBlock
  | VideoFileBlock
  | PhotoCollageBlock;

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

export type NoteDraft = {
  noteId: string;
  fetchedAt: string;
  modules: DraftModule[];
};
