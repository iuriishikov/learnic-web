import type { NoteSearchResult } from '../model/note-search-result';

/** Wire shape of one item in `GET /notes/{id}/search` (snake_case). */
export type NoteContentSearchResultResponse = {
  module_id: string;
  module_title: string;
  lesson_id: string;
  lesson_title: string;
  block_id: string | null;
  block_type: string | null;
  snippet: string;
};

export function fromNoteSearchResultResponse(
  raw: NoteContentSearchResultResponse,
): NoteSearchResult {
  return {
    moduleId: raw.module_id,
    moduleTitle: raw.module_title,
    lessonId: raw.lesson_id,
    lessonTitle: raw.lesson_title,
    blockId: raw.block_id,
    blockType: raw.block_type,
    snippet: raw.snippet,
  };
}
