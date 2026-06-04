'use client';

import { useQuery } from '@tanstack/react-query';

import type { NoteDraft } from '../model/draft';

import { getNoteDraftAction } from './draft-action';

export const noteDraftKey = (noteId: string) =>
  ['note-draft', noteId] as const;

export type NoteDraftErrorReason =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'not-a-note'
  | 'network'
  | 'unknown';

export class NoteDraftError extends Error {
  constructor(public readonly reason: NoteDraftErrorReason) {
    super(reason);
    this.name = 'NoteDraftError';
  }
}

export function useNoteDraft(noteId: string, enabled: boolean = true) {
  return useQuery<NoteDraft, NoteDraftError>({
    queryKey: noteDraftKey(noteId),
    queryFn: async () => {
      const result = await getNoteDraftAction(noteId);
      if (!result.ok) throw new NoteDraftError(result.reason);
      return result.draft;
    },
    enabled,
    staleTime: 30_000,
  });
}
