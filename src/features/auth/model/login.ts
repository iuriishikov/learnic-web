import { z } from 'zod';

import { EMAIL_MAX, PASSWORD_MAX } from './constants';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'emailRequired')
    .max(EMAIL_MAX, 'emailTooLong')
    .email('emailInvalid'),
  password: z
    .string()
    .min(1, 'passwordRequired')
    .max(PASSWORD_MAX, 'passwordTooLong'),
});

export type LoginInput = z.infer<typeof loginSchema>;
