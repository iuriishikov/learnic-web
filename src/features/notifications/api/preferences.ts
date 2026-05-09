'use server';

import { apiFetch } from '@/shared/api/client';

import {
  notificationPreferencesSchema,
  type GetPreferencesResult,
  type NotificationPreferences,
  type PreferencesError,
  type UpdatePreferencesResult,
} from '../model/preferences';

type PreferencesRaw = NotificationPreferences;

function statusToError(status: number): PreferencesError {
  if (status === 401) return { kind: 'invalidToken' };
  if (status === 403) return { kind: 'forbidden' };
  if (status === 404) return { kind: 'notFound' };
  return { kind: 'unknown' };
}

export async function getNotificationPreferencesAction(): Promise<GetPreferencesResult> {
  try {
    const res = await apiFetch('/users/me/notification-preferences', {
      method: 'GET',
    });
    if (res.status !== 200) {
      return { ok: false, error: statusToError(res.status) };
    }
    const raw = (await res.json()) as PreferencesRaw;
    return { ok: true, preferences: raw };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function updateNotificationPreferencesAction(
  input: unknown,
): Promise<UpdatePreferencesResult> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { kind: 'validation' } };
  }
  try {
    const res = await apiFetch('/users/me/notification-preferences', {
      method: 'PUT',
      body: parsed.data,
    });
    if (res.status !== 200) {
      return { ok: false, error: statusToError(res.status) };
    }
    const raw = (await res.json()) as PreferencesRaw;
    return { ok: true, preferences: raw };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
