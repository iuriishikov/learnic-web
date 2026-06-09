'use server';

import { enrollIntoProduct, type EnrollIntoProductResult } from './enrollment';

export async function enrollIntoProductAction(
  productId: string,
): Promise<EnrollIntoProductResult> {
  return enrollIntoProduct(productId);
}
