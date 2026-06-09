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
 * Learner-facing note content tree, read from the published release via
 * `GET /notes/{id}/content` (optional auth). Used by the public product
 * landing AND the in-product reader to render the full curriculum —
 * modules → lessons → block payloads.
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
 * The 7 non-interactive block types (html, katex, rutube_video, code, file,
 * video_file, photo_collage) are structurally identical to their draft
 * counterparts, so they are reused verbatim from `model/draft.ts`.
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

export type PublicModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: PublicLesson[];
};

export type PublicNoteContent = {
  noteId: string;
  releaseId: string;
  modules: PublicModule[];
};
