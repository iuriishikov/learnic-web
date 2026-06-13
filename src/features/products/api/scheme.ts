import 'server-only';

import { apiFetch } from '@/shared/api/client';

import {
  type PublicNoteSchemeResponse,
  fromNoteSchemeResponse,
} from '../lib/scheme-wire';
import type { PublicNoteScheme } from '../model/public-scheme';

export type GetNoteSchemeResult =
  | { ok: true; scheme: PublicNoteScheme }
  | {
      ok: false;
      reason: 'not-found' | 'service-unavailable' | 'network' | 'unknown';
    };

/**
 * Structure-only note scheme for the public product landing. The endpoint
 * uses optional auth: anonymous viewers and non-enrolled users get the latest
 * published release; an enrolled viewer gets their pinned release. Unlike
 * `GET /notes/{id}/release-lessons/{lesson_id}`, the scheme stays public for
 * `private` (invite-only) notes —
 * only the per-lesson block payloads are access-gated. A 404 means the product
 * is missing, not a note, or not published with no enrollment — the caller
 * hides the curriculum block in that case.
 */
export async function getNoteScheme(
  noteId: string,
): Promise<GetNoteSchemeResult> {
  let res: Response;
  try {
    res = await apiFetch(`/notes/${encodeURIComponent(noteId)}/scheme`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as PublicNoteSchemeResponse;
  return { ok: true, scheme: fromNoteSchemeResponse(raw) };
}
