'use server';

import { getCourseDraft, type GetCourseDraftResult } from './draft';

export async function getCourseDraftAction(
  courseId: string,
): Promise<GetCourseDraftResult> {
  return getCourseDraft(courseId);
}
