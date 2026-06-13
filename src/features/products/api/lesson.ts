import 'server-only';

import { apiFetch } from '@/shared/api/client';

import {
  type PublicLessonResponse,
  fromLessonResponse,
} from '../lib/lesson-wire';
import type { PublicLesson } from '../model/public-content';

export type GetNoteReleaseLessonResult =
  | { ok: true; lesson: PublicLesson }
  | {
      ok: false;
      reason: 'not-found' | 'service-unavailable' | 'network' | 'unknown';
    };

/**
 * One release lesson's blocks for the in-product reader. The per-lesson
 * companion of `GET /notes/{id}/scheme`: the scheme lists the lesson ids,
 * this endpoint loads one lesson's blocks on demand. Optional auth — an
 * enrolled viewer reads lessons of their pinned release, collaborators any
 * release, anonymous viewers only public + published notes. A 404 covers a
 * genuinely missing lesson AND every "no access" case uniformly.
 */
export async function getNoteReleaseLesson(
  noteId: string,
  lessonId: string,
): Promise<GetNoteReleaseLessonResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/release-lessons/${encodeURIComponent(lessonId)}`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 503) return { ok: false, reason: 'service-unavailable' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as PublicLessonResponse;
  return { ok: true, lesson: fromLessonResponse(raw) };
}
