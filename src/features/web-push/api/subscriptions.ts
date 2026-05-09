'use server';

import { apiFetch } from '@/shared/api/client';

import type {
  GetVapidKeyResult,
  ListDevicesResult,
  PushSubscribePayload,
  SubscribeResult,
  UnsubscribeResult,
} from '../model/types';

import {
  statusToError,
  toDevice,
  type DeviceListRaw,
  type VapidKeyRaw,
} from './_shared';

export async function getVapidPublicKeyAction(): Promise<GetVapidKeyResult> {
  try {
    const res = await apiFetch('/push/vapid-public-key', { method: 'GET' });
    if (res.status !== 200) {
      return { ok: false, error: statusToError(res.status) };
    }
    const raw = (await res.json()) as VapidKeyRaw;
    if (!raw.public_key) {
      return { ok: false, error: { kind: 'notConfigured' } };
    }
    return { ok: true, publicKey: raw.public_key };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function subscribePushAction(
  payload: PushSubscribePayload,
): Promise<SubscribeResult> {
  try {
    const res = await apiFetch('/users/me/push/subscriptions', {
      method: 'POST',
      body: payload,
    });
    if (res.status === 204) return { ok: true };
    return { ok: false, error: statusToError(res.status) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function unsubscribePushAction(
  endpoint: string,
): Promise<UnsubscribeResult> {
  try {
    const res = await apiFetch('/users/me/push/subscriptions', {
      method: 'DELETE',
      body: { endpoint },
    });
    if (res.status === 204) return { ok: true };
    return { ok: false, error: statusToError(res.status) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function listMyPushDevicesAction(): Promise<ListDevicesResult> {
  try {
    const res = await apiFetch('/users/me/push/subscriptions', {
      method: 'GET',
    });
    if (res.status !== 200) {
      return { ok: false, error: statusToError(res.status) };
    }
    const raw = (await res.json()) as DeviceListRaw;
    return { ok: true, items: raw.items.map(toDevice) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
