'use server';

import {
  getNoteContent,
  type GetNoteContentResult,
} from './content';

export async function getNoteContentAction(
  noteId: string,
): Promise<GetNoteContentResult> {
  return getNoteContent(noteId);
}
