'use server';

import { apiFetch } from '@/shared/api/client';

import type {
  CountersResult,
  ListResult,
  MarkReadResult,
  NotificationCategory,
  NotificationsError,
} from '../model/types';

import {
  toCounters,
  toPage,
  type CountersRaw,
  type NotificationPageRaw,
} from './_shared';

function statusToError(status: number): NotificationsError {
  if (status === 401) return { kind: 'invalidToken' };
  if (status === 403) return { kind: 'forbidden' };
  if (status === 404) return { kind: 'notFound' };
  return { kind: 'unknown' };
}

export async function listNotificationsAction(args: {
  category?: NotificationCategory;
  cursor?: string | null;
  limit?: number;
}): Promise<ListResult> {
  const params = new URLSearchParams();
  if (args.category) params.set('category', args.category);
  if (args.cursor) params.set('cursor', args.cursor);
  if (typeof args.limit === 'number') {
    params.set('limit', String(args.limit));
  }
  const qs = params.toString();
  const path = `/users/me/notifications${qs ? `?${qs}` : ''}`;
  try {
    const res = await apiFetch(path, { method: 'GET' });
    if (res.status === 200) {
      const raw = (await res.json()) as NotificationPageRaw;
      return { ok: true, page: toPage(raw) };
    }
    return { ok: false, error: statusToError(res.status) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function getNotificationCountersAction(): Promise<CountersResult> {
  try {
    const res = await apiFetch('/users/me/notifications/counters', {
      method: 'GET',
    });
    if (res.status === 200) {
      const raw = (await res.json()) as CountersRaw;
      return { ok: true, counters: toCounters(raw) };
    }
    return { ok: false, error: statusToError(res.status) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<MarkReadResult> {
  try {
    const res = await apiFetch(
      `/users/me/notifications/${notificationId}/read`,
      { method: 'POST' },
    );
    if (res.status === 204) return { ok: true };
    return { ok: false, error: statusToError(res.status) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}

export async function markAllNotificationsReadAction(): Promise<MarkReadResult> {
  try {
    const res = await apiFetch('/users/me/notifications/read-all', {
      method: 'POST',
    });
    if (res.status === 204) return { ok: true };
    return { ok: false, error: statusToError(res.status) };
  } catch {
    return { ok: false, error: { kind: 'network' } };
  }
}
