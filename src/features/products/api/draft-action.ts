'use server';

import { getNoteDraft, type GetNoteDraftResult } from './draft';

export async function getNoteDraftAction(
  noteId: string,
): Promise<GetNoteDraftResult> {
  return getNoteDraft(noteId);
}
