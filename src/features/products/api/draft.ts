import 'server-only';

import { apiFetch } from '@/shared/api/client';

import {
  type CourseDraftResponse,
  fromCourseDraftResponse,
} from '../lib/draft-wire';
import type { CourseDraft } from '../model/draft';

export type GetCourseDraftResult =
  | { ok: true; draft: CourseDraft }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'not-a-course'
        | 'network'
        | 'unknown';
    };

export async function getCourseDraft(
  courseId: string,
): Promise<GetCourseDraftResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(courseId)}/content/draft`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'not-a-course' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as CourseDraftResponse;
  return { ok: true, draft: fromCourseDraftResponse(raw) };
}
