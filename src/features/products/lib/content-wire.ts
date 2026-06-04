/**
 * Wire types + mapper for the learner-facing public note-content tree
 * (`GET /notes/{id}/content`, response `PublicNoteReleaseContentSchema`).
 *
 * The landing previews structure only, so — unlike `draft-wire.ts` — block
 * payloads are projected down to `{ type, oid, position }`. Extra wire fields
 * (html, options, file, …) are intentionally ignored; the structural read
 * stays valid whatever a block carries.
 *
 * Field-name convention: snake_case on the wire (mirrors the backend Pydantic
 * schemas), camelCase in the domain types.
 */

import type { LessonBlockType } from '../model/draft';
import type {
  PublicNoteContent,
  PublicLesson,
  PublicModule,
} from '../model/public-content';

type PublicBlockResponse = {
  type: LessonBlockType;
  oid: string;
  position: number;
};

type PublicLessonResponse = {
  oid: string;
  title: string;
  position: number;
  blocks: PublicBlockResponse[];
};

type PublicModuleResponse = {
  oid: string;
  title: string;
  description: string | null;
  position: number;
  lessons: PublicLessonResponse[];
};

export type PublicNoteContentResponse = {
  release_id: string;
  note_id: string;
  modules: PublicModuleResponse[];
};

export function fromPublicNoteContentResponse(
  raw: PublicNoteContentResponse,
): PublicNoteContent {
  return {
    noteId: raw.note_id,
    releaseId: raw.release_id,
    modules: [...raw.modules]
      .sort((a, b) => a.position - b.position)
      .map(fromModuleResponse),
  };
}

function fromModuleResponse(raw: PublicModuleResponse): PublicModule {
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

function fromLessonResponse(raw: PublicLessonResponse): PublicLesson {
  return {
    id: raw.oid,
    title: raw.title,
    position: raw.position,
    blocks: [...raw.blocks]
      .sort((a, b) => a.position - b.position)
      .map((b) => ({ id: b.oid, type: b.type, position: b.position })),
  };
}
