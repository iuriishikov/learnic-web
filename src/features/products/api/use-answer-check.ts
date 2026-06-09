'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SavedBlockAnswer } from '../model/saved-answer';

import type { CheckAnswerPayload, RevealedAnswer } from './answer-check';
import {
  checkBlockAnswerAction,
  revealBlockAnswerAction,
} from './answer-check-action';
import { myBlockAnswersKey } from './use-saved-answers';

/**
 * Per-block answer checking. The block shows its own correct / incorrect
 * feedback locally, AND — because the server now persists the latest
 * submission — the result is written into the saved-answers cache on success
 * so the selection + verdict survive lesson navigation within the session
 * (the block restores from that cache when it remounts), matching what a full
 * reload would show. The `mutationFn` throws `Error(reason)` on a failed
 * result so consumers branch on `isError` / `error.message`.
 */
export function useCheckBlockAnswer(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    { isCorrect: boolean },
    Error,
    { blockId: string; payload: CheckAnswerPayload }
  >({
    mutationFn: async ({ blockId, payload }) => {
      const result = await checkBlockAnswerAction(noteId, blockId, payload);
      if (!result.ok) throw new Error(result.reason);
      return { isCorrect: result.isCorrect };
    },
    onSuccess: ({ isCorrect }, { blockId, payload }) => {
      queryClient.setQueryData<SavedBlockAnswer[]>(
        myBlockAnswersKey(noteId),
        (prev) => {
          const entry: SavedBlockAnswer = {
            blockId,
            isCorrect,
            submission: payload,
          };
          const list = prev ?? [];
          const idx = list.findIndex((a) => a.blockId === blockId);
          if (idx === -1) return [...list, entry];
          const next = [...list];
          next[idx] = entry;
          return next;
        },
      );
    },
  });
}

/**
 * Reveal the accepted answer(s) for a block. Same shape as the check
 * mutation — local result, throws `Error(reason)` on failure.
 */
export function useRevealBlockAnswer(noteId: string) {
  return useMutation<RevealedAnswer, Error, { blockId: string }>({
    mutationFn: async ({ blockId }) => {
      const result = await revealBlockAnswerAction(noteId, blockId);
      if (!result.ok) throw new Error(result.reason);
      return result.revealed;
    },
  });
}
