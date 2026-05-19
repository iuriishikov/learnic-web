'use server';

import { apiFetch } from '@/shared/api/client';

import {
  type MySubscription,
  type MySubscriptionResponse,
  fromMySubscriptionResponse,
} from '../model/subscription';

export type GetMySubscriptionResult =
  | { ok: true; subscription: MySubscription }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown' };

export async function getMySubscriptionAction(): Promise<GetMySubscriptionResult> {
  let res: Response;
  try {
    res = await apiFetch('/users/me/subscription', { method: 'GET' });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 200) {
    const json = (await res.json()) as MySubscriptionResponse;
    return { ok: true, subscription: fromMySubscriptionResponse(json) };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  return { ok: false, reason: 'unknown' };
}
