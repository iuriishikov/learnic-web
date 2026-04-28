import { z } from 'zod';

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'tokenRequired'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type WaitResult = 'verified' | 'waiting' | 'expired' | 'error';
