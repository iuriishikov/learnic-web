'use client';

/**
 * Browser-side Web Push registration helpers.
 *
 * Concentrates the gnarly parts in one module:
 * - register the SW at /sw.js
 * - decode VAPID public key into Uint8Array
 * - subscribe via PushManager and serialise the keys to Base64
 *   for transport to the backend
 */

export type SerializedSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return null;
  }
  return Notification.permission;
}

/** True if the SPA is running as an installed PWA (iOS standalone mode). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS sets `navigator.standalone = true` in standalone mode; the
  // CSS media query covers Chromium / desktop installs.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navStandalone = (window.navigator as any).standalone === true;
  const matches =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  return navStandalone || matches;
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const platform = window.navigator.platform || '';
  // iPadOS 13+ identifies as Mac; check for touch points to disambiguate.
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser');
  }
  return navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeOnDevice(
  applicationServerKey: string,
): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  const key = urlBase64ToUint8Array(applicationServerKey);
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: key as BufferSource,
  });
}

export async function unsubscribeOnDevice(): Promise<string | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

export function serializeSubscription(
  sub: PushSubscription,
): SerializedSubscription {
  const json = sub.toJSON();
  const keys = json.keys ?? {};
  const p256dh = keys.p256dh;
  const auth = keys.auth;
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('PushSubscription is missing endpoint or keys');
  }
  return {
    endpoint: json.endpoint,
    p256dh,
    auth,
  };
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i);
  }
  return out;
}
