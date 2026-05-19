'use server';

import {
  getPublishedProducts,
  type GetPublishedProductsResult,
} from './get-published';

export async function getPublishedProductsAction(args: {
  offset?: number;
  limit?: number;
  q?: string;
}): Promise<GetPublishedProductsResult> {
  return getPublishedProducts(args);
}
