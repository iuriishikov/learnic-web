import 'server-only';

import { apiFetch } from '@/shared/api/client';

import {
  type PublicNoteContentResponse,
  fromPublicNoteContentResponse,
} from '../lib/content-wire';
import type { PublicNoteContent } from '../model/public-content';

export type GetNoteContentResult =
  | { ok: true; content: PublicNoteContent }
  | {
      ok: false;
      reason: 'not-found' | 'service-unavailable' | 'network' | 'unknown';
    };

/**
 * Learner-facing note content for the public product landing. The endpoint
 * uses optional auth: anonymous viewers and non-enrolled users get the latest
 * published release; an enrolled viewer gets their pinned release. A 404 means
 * the product is missing, not a note, or not published with no enrollment —
 * the caller hides the curriculum block in that case.
 */
export async function getNoteContent(
  noteId: string,
): Promise<GetNoteContentResult> {
  let res: Response;
  try {
    res = await apiFetch(`/notes/${encodeURIComponent(noteId)}/content`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as PublicNoteContentResponse;
  return { ok: true, content: fromPublicNoteContentResponse(raw) };
}
