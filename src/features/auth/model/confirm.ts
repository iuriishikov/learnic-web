import { z } from 'zod';

export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'tokenRequired'),
});

export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;

export type VerifyTokenResult =
  | { ok: true; purpose: string }
  | { ok: false; error: { kind: 'invalidToken' } | { kind: 'network' } };

export type TokenStatusResult =
  | { ok: true; purpose: string }
  | { ok: false; error: { kind: 'invalidToken' } | { kind: 'network' } };
