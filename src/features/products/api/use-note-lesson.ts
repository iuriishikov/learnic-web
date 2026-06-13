'use client';

import { useQuery } from '@tanstack/react-query';

import type { PublicLesson } from '../model/public-content';

import { getNoteReleaseLessonAction } from './lesson-action';

/**
 * Prefix shared by every per-lesson cache entry of a note. Invalidate (or
 * remove) by this prefix to touch all cached lessons of the note at once.
 */
export const noteLessonsPrefix = (noteId: string) =>
  ['note-lesson', noteId] as const;

export const noteLessonKey = (noteId: string, lessonId: string) =>
  [...noteLessonsPrefix(noteId), lessonId] as const;

export type NoteLessonErrorReason =
  | 'not-found'
  | 'service-unavailable'
  | 'network'
  | 'unknown';

export class NoteLessonError extends Error {
  constructor(public readonly reason: NoteLessonErrorReason) {
    super(reason);
    this.name = 'NoteLessonError';
  }
}

const NOTE_LESSON_STALE_TIME = 60_000;

async function fetchNoteLesson(
  noteId: string,
  lessonId: string,
): Promise<PublicLesson> {
  const result = await getNoteReleaseLessonAction(noteId, lessonId);
  if (!result.ok) throw new NoteLessonError(result.reason);
  return result.lesson;
}

/**
 * Query options for one lesson's blocks — shared between {@link useNoteLesson}
 * and imperative `queryClient.prefetchQuery` calls (e.g. warming the next
 * lesson so the «Дальше» click paints instantly).
 */
export function noteLessonQueryOptions(noteId: string, lessonId: string) {
  return {
    queryKey: noteLessonKey(noteId, lessonId),
    queryFn: () => fetchNoteLesson(noteId, lessonId),
    staleTime: NOTE_LESSON_STALE_TIME,
  };
}

/**
 * One release lesson's blocks, loaded on demand once the scheme has handed
 * out the lesson ids. `lessonId === null` skips the fetch entirely (no lesson
 * selected, or the scheme already says the lesson has zero blocks).
 */
export function useNoteLesson(noteId: string, lessonId: string | null) {
  return useQuery<PublicLesson, NoteLessonError>({
    // Disabled queries still need a stable key; the spread keeps it under the
    // per-note prefix either way and matches `noteLessonKey` when enabled.
    queryKey: [...noteLessonsPrefix(noteId), lessonId] as const,
    queryFn: () => {
      // Unreachable while disabled — the guard only narrows the type.
      if (lessonId === null) throw new NoteLessonError('unknown');
      return fetchNoteLesson(noteId, lessonId);
    },
    enabled: lessonId !== null,
    staleTime: NOTE_LESSON_STALE_TIME,
  });
}
