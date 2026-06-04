import type { LessonBlockType } from './draft';

/**
 * Learner-facing note content tree, read from the published release via
 * `GET /notes/{id}/content` (optional auth, answer keys stripped). Used by
 * the public product landing to preview the curriculum BEFORE enrollment.
 *
 * Distinct from {@link import('./draft').NoteDraft}, which is the authoring
 * view behind `READ_PRODUCT` and carries full block payloads (incl. correct
 * answers). The landing only needs structure — modules → lessons and a count
 * of blocks per lesson — so blocks are projected down to type + position.
 */
export type PublicLessonBlockInfo = {
  id: string;
  type: LessonBlockType;
  position: number;
};

export type PublicLesson = {
  id: string;
  title: string;
  position: number;
  blocks: PublicLessonBlockInfo[];
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
