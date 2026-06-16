'use client';

import { useQuery } from '@tanstack/react-query';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';

import type { NoteSearchResult } from '../model/note-search-result';

import { searchNoteContentAction } from './note-content-search-action';

/** Mirrors the backend `SEARCH_QUERY_MIN_LEN` — shorter queries don't fetch. */
export const NOTE_SEARCH_MIN_QUERY_LEN = 2;

export const noteContentSearchKey = (noteId: string, query: string) =>
  ['note-content-search', noteId, query] as const;

export type NoteContentSearchErrorReason =
  | 'not-found'
  | 'service-unavailable'
  | 'network'
  | 'unknown';

export class NoteContentSearchError extends Error {
  constructor(public readonly reason: NoteContentSearchErrorReason) {
    super(reason);
    this.name = 'NoteContentSearchError';
  }
}

/**
 * Debounced full-text search over a note's content. Pass the raw input
 * value — it is trimmed + debounced internally, and the query only
 * fires once it reaches {@link NOTE_SEARCH_MIN_QUERY_LEN} characters.
 * Prior results stay visible while the next query is in flight (no
 * flicker between keystrokes).
 */
export function useNoteContentSearch(noteId: string, rawQuery: string) {
  const query = useDebouncedValue(rawQuery.trim(), 250);
  const enabled = query.length >= NOTE_SEARCH_MIN_QUERY_LEN;

  return useQuery<NoteSearchResult[], NoteContentSearchError>({
    queryKey: noteContentSearchKey(noteId, query),
    queryFn: async () => {
      const result = await searchNoteContentAction(noteId, query);
      if (!result.ok) throw new NoteContentSearchError(result.reason);
      return result.results;
    },
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
