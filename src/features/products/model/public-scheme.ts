/**
 * Structure-only note scheme tree, read via `GET /notes/{id}/scheme`
 * (optional auth). The backend resolves the release per viewer (enrolled
 * viewer → their pinned release, anyone else → the latest published one),
 * and lessons carry only a `blockCount` instead of block payloads — safe to
 * show publicly even for invite-only (`private`) notes whose full content is
 * enrollment-gated. Powers the marketplace landing's curriculum preview AND
 * the in-product reader's skeleton; the block payloads themselves load per
 * lesson via `GET /notes/{note_id}/release-lessons/{lesson_id}`
 * ({@link import('./public-content').PublicLesson}).
 */

export type PublicSchemeLesson = {
  id: string;
  title: string;
  position: number;
  blockCount: number;
};

export type PublicSchemeModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: PublicSchemeLesson[];
};

export type PublicNoteScheme = {
  noteId: string;
  releaseId: string;
  modules: PublicSchemeModule[];
};
