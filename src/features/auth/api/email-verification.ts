'use server';

import { cookies } from 'next/headers';

import { apiFetch } from '@/shared/api/client';

import { verifyEmailSchema, type WaitResult } from '../model/email-verification';
import type { AuthResult } from '../model/types';
import { safeErrorMessage } from './_shared';

export async function verifyEmailAction(input: unknown): Promise<AuthResult> {
  const parsed = verifyEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'invalidToken' } };
  }

  try {
    const res = await apiFetch('/auth/email-verification/verify', {
      method: 'POST',
      body: { token: parsed.data.token },
    });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) {
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    if (res.status === 422) {
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    const message = await safeErrorMessage(res);
    return { ok: false, error: { kind: 'unknown', message } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function waitForEmailVerificationAction(): Promise<WaitResult> {
  try {
    const res = await apiFetch('/auth/email-verification/wait', {
      method: 'GET',
    });
    if (res.status === 200) return 'verified';
    if (res.status === 204) return 'waiting';
    if (res.status === 401) return 'expired';
    return 'error';
  } catch {
    return 'error';
  }
}

export async function hasSignupSessionAction(): Promise<boolean> {
  const store = await cookies();
  return store.has('signup_session');
}

export type ResendVerificationResult =
  | { ok: true }
  | {
      ok: false;
      error: { kind: 'invalidToken' } | { kind: 'network' } | { kind: 'unknown' };
    };

export async function resendVerificationAction(): Promise<ResendVerificationResult> {
  try {
    const res = await apiFetch('/auth/email-verification/resend', {
      method: 'POST',
    });
    if (res.status === 204) return { ok: true };
    if (res.status === 401) {
      return { ok: false, error: { kind: 'invalidToken' } };
    }
    return { ok: false, error: { kind: 'unknown' } };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
