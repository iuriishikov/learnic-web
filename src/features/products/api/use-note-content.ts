'use client';

import { useQuery } from '@tanstack/react-query';

import type { PublicNoteContent } from '../model/public-content';

import { getNoteContentAction } from './content-action';

export const noteContentKey = (noteId: string) =>
  ['note-content', noteId] as const;

export type NoteContentErrorReason =
  | 'not-found'
  | 'service-unavailable'
  | 'network'
  | 'unknown';

export class NoteContentError extends Error {
  constructor(public readonly reason: NoteContentErrorReason) {
    super(reason);
    this.name = 'NoteContentError';
  }
}

/**
 * Public note curriculum for the product landing. `enabled` lets the caller
 * skip the fetch for non-note product types.
 */
export function useNoteContent(noteId: string, enabled: boolean = true) {
  return useQuery<PublicNoteContent, NoteContentError>({
    queryKey: noteContentKey(noteId),
    queryFn: async () => {
      const result = await getNoteContentAction(noteId);
      if (!result.ok) throw new NoteContentError(result.reason);
      return result.content;
    },
    enabled,
    staleTime: 60_000,
  });
}
