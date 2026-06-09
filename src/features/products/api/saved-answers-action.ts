'use server';

import {
  getMySavedAnswers,
  type GetMySavedAnswersResult,
} from './saved-answers';

export async function getMySavedAnswersAction(
  noteId: string,
): Promise<GetMySavedAnswersResult> {
  return getMySavedAnswers(noteId);
}
