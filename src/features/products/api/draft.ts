import 'server-only';

import { apiFetch } from '@/shared/api/client';

import {
  type NoteDraftResponse,
  fromNoteDraftResponse,
} from '../lib/draft-wire';
import type { NoteDraft } from '../model/draft';

export type GetNoteDraftResult =
  | { ok: true; draft: NoteDraft }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'not-a-note'
        | 'network'
        | 'unknown';
    };

export async function getNoteDraft(
  noteId: string,
): Promise<GetNoteDraftResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/content/draft`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'not-a-note' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as NoteDraftResponse;
  return { ok: true, draft: fromNoteDraftResponse(raw) };
}
