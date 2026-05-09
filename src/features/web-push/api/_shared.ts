import 'server-only';

import type { PushSubscriptionDevice, WebPushError } from '../model/types';

export type DeviceRaw = {
  oid: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
};

export type DeviceListRaw = {
  items: DeviceRaw[];
};

export type VapidKeyRaw = {
  public_key: string;
};

export function toDevice(raw: DeviceRaw): PushSubscriptionDevice {
  return {
    oid: raw.oid,
    endpoint: raw.endpoint,
    userAgent: raw.user_agent,
    createdAt: raw.created_at,
    lastSeenAt: raw.last_seen_at,
  };
}

export function statusToError(status: number): WebPushError {
  if (status === 401) return { kind: 'invalidToken' };
  if (status === 403) return { kind: 'forbidden' };
  if (status === 404) return { kind: 'notFound' };
  return { kind: 'unknown' };
}
