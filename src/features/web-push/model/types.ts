/**
 * Frontend types for the Web Push subscription flow.
 *
 * These mirror the backend `/users/me/web-push/subscriptions` and
 * `/web-push/vapid-public-key` shapes; the api/ layer flattens
 * snake_case into camelCase before it reaches the rest of the SPA.
 */

export type PushSubscriptionDevice = {
  oid: string;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
};

export type PushSubscribePayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
};

export type WebPushError =
  | { kind: 'invalidToken' }
  | { kind: 'notFound' }
  | { kind: 'forbidden' }
  | { kind: 'network' }
  | { kind: 'notConfigured' }
  | { kind: 'unknown'; message?: string };

export type GetVapidKeyResult =
  | { ok: true; publicKey: string }
  | { ok: false; error: WebPushError };

export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: WebPushError };

export type UnsubscribeResult =
  | { ok: true }
  | { ok: false; error: WebPushError };

export type ListDevicesResult =
  | { ok: true; items: PushSubscriptionDevice[] }
  | { ok: false; error: WebPushError };

/**
 * Local state of the SW push registration flow on this device.
 *
 * `unsupported` — browser has no Service Worker / Push API
 *   (Safari pre-PWA, Brave with shields locked down, etc.).
 * `pwa-required` — iOS Safari outside the standalone PWA shell.
 *   We render the install-as-PWA hint instead of the subscribe button.
 * `permission-default` — never asked the user yet.
 * `permission-denied` — browser-level permission was denied;
 *   subscribing again won't show another prompt, the user must
 *   re-grant via site settings.
 * `subscribed` — SW has an active push subscription synced with
 *   the backend (or believed to be).
 * `unsubscribed` — permission granted, no subscription on device.
 */
export type PushDeviceStatus =
  | 'unsupported'
  | 'pwa-required'
  | 'permission-default'
  | 'permission-denied'
  | 'subscribed'
  | 'unsubscribed';
