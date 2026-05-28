'use server';

import { getMyProducts, type GetMyProductsResult } from './get-my-products';

export async function getMyProductsAction(args: {
  offset?: number;
  limit?: number;
  q?: string;
}): Promise<GetMyProductsResult> {
  return getMyProducts(args);
}
