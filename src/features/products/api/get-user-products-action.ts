'use server';

import {
  getUserProducts,
  type GetUserProductsResult,
} from './get-user-products';

export async function getUserProductsAction(args: {
  userId: string;
  offset?: number;
  limit?: number;
}): Promise<GetUserProductsResult> {
  return getUserProducts(args);
}
