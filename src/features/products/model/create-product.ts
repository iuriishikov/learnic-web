import { z } from 'zod';

import type { ProductType } from './types';

export const createProductSchema = z.object({
  type: z.enum(['course', 'webinar']),
  title: z.string().trim().min(2, 'titleMin').max(120, 'titleMax'),
  description: z
    .string()
    .trim()
    .max(500, 'descriptionMax')
    .optional()
    .or(z.literal('')),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const PRODUCT_TYPES: ProductType[] = ['course', 'webinar'];
