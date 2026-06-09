'use client';

import { useQuery } from '@tanstack/react-query';

import type { SavedBlockAnswer } from '../model/saved-answer';

import { getMySavedAnswersAction } from './saved-answers-action';

export const myBlockAnswersKey = (noteId: string) =>
  ['note-block-answers', noteId] as const;

/**
 * The enrolled student's saved answers for a note, used to restore selections
 * + verdicts in the reader. `enabled` lets the caller skip the fetch for guest
 * viewers (who have no saved answers). Restore is best-effort: a failed fetch
 * resolves to an empty list rather than throwing, so a hiccup never breaks the
 * reader — the learner just starts from a blank slate.
 */
export function useMySavedAnswers(noteId: string, enabled: boolean = true) {
  return useQuery<SavedBlockAnswer[]>({
    queryKey: myBlockAnswersKey(noteId),
    queryFn: async () => {
      const result = await getMySavedAnswersAction(noteId);
      return result.ok ? result.answers : [];
    },
    enabled,
    staleTime: 60_000,
  });
}
