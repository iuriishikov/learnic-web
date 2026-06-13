'use server';

import {
  getNoteScheme,
  type GetNoteSchemeResult,
} from './scheme';

export async function getNoteSchemeAction(
  noteId: string,
): Promise<GetNoteSchemeResult> {
  return getNoteScheme(noteId);
}
