'use server';

import { apiFetch } from '@/shared/api/client';

export type ContactsMutationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
    };

async function safeMessage(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error;
  } catch {
    return undefined;
  }
}

async function putContactField(
  path: string,
  value: string | null,
): Promise<ContactsMutationResult> {
  let res: Response;
  try {
    res = await apiFetch(path, { method: 'PUT', body: { value } });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 204) return { ok: true };
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 422) {
    const message = await safeMessage(res);
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function changeWebsiteUrlAction(
  value: string | null,
): Promise<ContactsMutationResult> {
  return putContactField('/users/me/website-url', value);
}

export async function changePortfolioUrlAction(
  value: string | null,
): Promise<ContactsMutationResult> {
  return putContactField('/users/me/portfolio-url', value);
}

export async function changePublicEmailAction(
  value: string | null,
): Promise<ContactsMutationResult> {
  return putContactField('/users/me/public-email', value);
}
