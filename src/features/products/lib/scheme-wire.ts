/**
 * Wire types + mapper for the structure-only note scheme tree
 * (`GET /notes/{id}/scheme`, response `PublicNoteSchemeSchema`).
 *
 * The catalog ("course program") companion of `lesson-wire.ts`: the backend
 * resolves the release the same way, but lessons carry only a `block_count`
 * instead of block payloads, so the tree stays public even for invite-only
 * (`private`) notes whose full content is enrollment-gated. The wire-level
 * release header (ordinal/version/kind/notes/released_at) is dropped at this
 * boundary — consumers only need the module → lesson structure; the block
 * payloads load per lesson through `lesson-wire.ts`.
 *
 * Field-name convention: snake_case on the wire (mirrors the backend Pydantic
 * schemas), camelCase in the domain types.
 */

import type {
  PublicNoteScheme,
  PublicSchemeLesson,
  PublicSchemeModule,
} from '../model/public-scheme';

type PublicSchemeLessonResponse = {
  oid: string;
  title: string;
  position: number;
  block_count: number;
};

type PublicSchemeModuleResponse = {
  oid: string;
  title: string;
  description: string | null;
  position: number;
  lessons: PublicSchemeLessonResponse[];
};

export type PublicNoteSchemeResponse = {
  release_id: string;
  note_id: string;
  modules: PublicSchemeModuleResponse[];
};

export function fromNoteSchemeResponse(
  raw: PublicNoteSchemeResponse,
): PublicNoteScheme {
  return {
    noteId: raw.note_id,
    releaseId: raw.release_id,
    modules: [...raw.modules]
      .sort((a, b) => a.position - b.position)
      .map(fromModuleResponse),
  };
}

function fromModuleResponse(
  raw: PublicSchemeModuleResponse,
): PublicSchemeModule {
  return {
    id: raw.oid,
    title: raw.title,
    description: raw.description,
    position: raw.position,
    lessons: [...raw.lessons]
      .sort((a, b) => a.position - b.position)
      .map(fromLessonResponse),
  };
}

function fromLessonResponse(
  raw: PublicSchemeLessonResponse,
): PublicSchemeLesson {
  return {
    id: raw.oid,
    title: raw.title,
    position: raw.position,
    blockCount: raw.block_count,
  };
}
