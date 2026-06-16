'use server';

import {
  searchNoteContent,
  type SearchNoteContentResult,
} from './note-content-search';

export async function searchNoteContentAction(
  noteId: string,
  query: string,
): Promise<SearchNoteContentResult> {
  return searchNoteContent(noteId, query);
}
