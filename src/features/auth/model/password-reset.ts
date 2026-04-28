import { z } from 'zod';

import { EMAIL_MAX, PASSWORD_MAX, PASSWORD_MIN } from './constants';

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'emailRequired')
    .max(EMAIL_MAX, 'emailTooLong')
    .email('emailInvalid'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'tokenRequired'),
  password: z
    .string()
    .min(PASSWORD_MIN, 'passwordTooShort')
    .max(PASSWORD_MAX, 'passwordTooLong'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
