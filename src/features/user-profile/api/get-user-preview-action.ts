'use server';

import { getUserPreview, type GetUserPreviewResult } from './preview';

export async function getUserPreviewAction(
  userId: string,
): Promise<GetUserPreviewResult> {
  return getUserPreview(userId);
}
