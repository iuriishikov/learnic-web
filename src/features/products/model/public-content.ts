import type {
  ChoiceOption,
  CodeBlock,
  FileBlock,
  FunctionGraphBlock,
  HtmlBlock,
  KatexBlock,
  PhotoCollageBlock,
  RutubeVideoBlock,
  VideoFileBlock,
} from './draft';

/**
 * Learner-facing lesson read from the published release via
 * `GET /notes/{note_id}/release-lessons/{lesson_id}` (optional auth). The
 * scheme (`model/public-scheme.ts`) is the structure-only skeleton; this is
 * the on-demand payload of a single lesson — the in-product reader loads one
 * lesson's blocks at a time.
 *
 * Distinct from {@link import('./draft').NoteDraft}, which is the authoring
 * view behind `READ_PRODUCT`. Both carry full, renderable block payloads;
 * the difference is the interactive blocks. On the public wire the answer
 * keys are stripped at the HTTP boundary, so:
 *
 *  - single/multi choice expose `options` (id + label) but NOT the correct
 *    option(s) — grading goes through `POST .../release-blocks/{id}/check`.
 *  - text input exposes only the normalisation flags (`caseSensitive`,
 *    `trimWhitespace`), never the accepted-answer list.
 *
 * The 8 non-interactive block types (html, katex, rutube_video, code, file,
 * video_file, photo_collage, function_graph) are structurally identical to
 * their draft counterparts, so they are reused verbatim from `model/draft.ts`.
 */

export type PublicSingleChoiceBlock = {
  type: 'single_choice';
  id: string;
  position: number;
  options: ChoiceOption[];
};

export type PublicMultiChoiceBlock = {
  type: 'multi_choice';
  id: string;
  position: number;
  options: ChoiceOption[];
};

export type PublicTextInputBlock = {
  type: 'text_input';
  id: string;
  position: number;
  caseSensitive: boolean;
  trimWhitespace: boolean;
};

export type PublicLessonBlock =
  | HtmlBlock
  | KatexBlock
  | RutubeVideoBlock
  | CodeBlock
  | PublicSingleChoiceBlock
  | PublicMultiChoiceBlock
  | PublicTextInputBlock
  | FileBlock
  | VideoFileBlock
  | PhotoCollageBlock
  | FunctionGraphBlock;

export type PublicLesson = {
  id: string;
  title: string;
  position: number;
  blocks: PublicLessonBlock[];
};
