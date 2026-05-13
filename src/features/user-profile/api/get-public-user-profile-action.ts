'use server';

import { getPublicUserProfile, type GetPublicUserProfileResult } from './queries';

export async function getPublicUserProfileAction(
  userId: string,
): Promise<GetPublicUserProfileResult> {
  return getPublicUserProfile(userId);
}
