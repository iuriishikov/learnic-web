'use server';

import { apiFetch } from '@/shared/api/client';

import {
  verifyTokenSchema,
  type TokenStatusResult,
  type VerifyTokenResult,
} from '../model/confirm';

type PurposeBody = { purpose?: unknown };

async function readPurpose(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as PurposeBody;
    return typeof data.purpose === 'string' ? data.purpose : null;
  } catch {
    return null;
  }
}

export async function verifyTokenAction(
  input: unknown,
): Promise<VerifyTokenResult> {
  const parsed = verifyTokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'invalidToken' } };
  }

  try {
    const res = await apiFetch('/auth/verify-token', {
      method: 'POST',
      body: { token: parsed.data.token },
    });
    if (res.status === 200) {
      const purpose = await readPurpose(res);
      if (purpose) return { ok: true, purpose };
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    if (res.status === 401) {
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    return { ok: false, error: { kind: 'invalidToken' } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function getTokenStatusAction(
  input: unknown,
): Promise<TokenStatusResult> {
  const parsed = verifyTokenSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'invalidToken' } };
  }

  try {
    const res = await apiFetch('/auth/token-status', {
      method: 'POST',
      body: { token: parsed.data.token },
    });
    if (res.status === 200) {
      const purpose = await readPurpose(res);
      if (purpose) return { ok: true, purpose };
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    return { ok: false, error: { kind: 'invalidToken' } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
