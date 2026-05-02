'use server';

import { getProductById, type GetProductByIdResult } from './get-product-by-id';

export async function getProductByIdAction(
  productId: string,
): Promise<GetProductByIdResult> {
  return getProductById(productId);
}
