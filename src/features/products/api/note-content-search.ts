import 'server-only';

import { apiFetch } from '@/shared/api/client';

import {
  type NoteContentSearchResultResponse,
  fromNoteSearchResultResponse,
} from '../lib/note-search-wire';
import type { NoteSearchResult } from '../model/note-search-result';

export type SearchNoteContentResult =
  | { ok: true; results: NoteSearchResult[] }
  | {
      ok: false;
      reason: 'not-found' | 'service-unavailable' | 'network' | 'unknown';
    };

/**
 * Full-text search a note's release content for the current viewer.
 * Optional-auth endpoint: an enrolled viewer searches their pinned
 * release, anyone else the latest published one — and only when they
 * may read the content (a `private` note's content stays gated, so an
 * outsider gets 404, same as the per-lesson read). Searches block text,
 * module titles/descriptions and lesson titles; returns ranked matches
 * with `<<hl>>…<</hl>>`-marked snippets.
 */
export async function searchNoteContent(
  noteId: string,
  query: string,
): Promise<SearchNoteContentResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/search` +
        `?q=${encodeURIComponent(query)}`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as NoteContentSearchResultResponse[];
  return { ok: true, results: raw.map(fromNoteSearchResultResponse) };
}
