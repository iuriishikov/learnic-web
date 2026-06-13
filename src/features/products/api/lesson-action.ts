'use server';

import {
  getNoteReleaseLesson,
  type GetNoteReleaseLessonResult,
} from './lesson';

export async function getNoteReleaseLessonAction(
  noteId: string,
  lessonId: string,
): Promise<GetNoteReleaseLessonResult> {
  return getNoteReleaseLesson(noteId, lessonId);
}
