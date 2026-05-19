'use server';

import {
  getPopularTags,
  type GetPopularTagsResult,
} from './get-popular-tags';

export async function getPopularTagsAction(args: {
  limit?: number;
}): Promise<GetPopularTagsResult> {
  return getPopularTags(args);
}
