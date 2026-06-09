'use server';

import {
  checkBlockAnswer,
  revealBlockAnswer,
  type CheckAnswerPayload,
  type CheckBlockAnswerResult,
  type RevealBlockAnswerResult,
} from './answer-check';

export async function checkBlockAnswerAction(
  noteId: string,
  blockId: string,
  payload: CheckAnswerPayload,
): Promise<CheckBlockAnswerResult> {
  return checkBlockAnswer(noteId, blockId, payload);
}

export async function revealBlockAnswerAction(
  noteId: string,
  blockId: string,
): Promise<RevealBlockAnswerResult> {
  return revealBlockAnswer(noteId, blockId);
}
