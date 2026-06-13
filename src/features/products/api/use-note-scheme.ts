'use client';

import { useQuery } from '@tanstack/react-query';

import type { PublicNoteScheme } from '../model/public-scheme';

import { getNoteSchemeAction } from './scheme-action';

export const noteSchemeKey = (noteId: string) =>
  ['note-scheme', noteId] as const;

export type NoteSchemeErrorReason =
  | 'not-found'
  | 'service-unavailable'
  | 'network'
  | 'unknown';

export class NoteSchemeError extends Error {
  constructor(public readonly reason: NoteSchemeErrorReason) {
    super(reason);
    this.name = 'NoteSchemeError';
  }
}

/**
 * Public note curriculum structure for the product landing. `enabled` lets
 * the caller skip the fetch for non-note product types.
 */
export function useNoteScheme(noteId: string, enabled: boolean = true) {
  return useQuery<PublicNoteScheme, NoteSchemeError>({
    queryKey: noteSchemeKey(noteId),
    queryFn: async () => {
      const result = await getNoteSchemeAction(noteId);
      if (!result.ok) throw new NoteSchemeError(result.reason);
      return result.scheme;
    },
    enabled,
    staleTime: 60_000,
  });
}
