/* Web Push service worker for Learnic.
 *
 * Receives push events from the browser-vendor push service and
 * renders them as system notifications. The payload shape is the
 * one emitted by the backend `PushPayload`:
 *   { title, body, url?, tag?, icon? }
 *
 * Registered from the client side at /sw.js — no PWA framework,
 * just the bare push lifecycle. If you add caching later, do it
 * here behind feature flags so push delivery stays the priority
 * surface.
 */

/* eslint-disable no-undef -- service-worker globals (self, clients, ...) */

self.addEventListener('install', (event) => {
  // Take over immediately on first install — Web Push registration
  // works as soon as the SW is active, no need to wait for a
  // page reload.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      // Some push services send empty pings (encryption failure
      // upstream, or a deliberate "wake the SW" message). Render
      // a generic banner so the user knows something happened.
      payload = { title: 'New notification', body: '' };
    }
  }
  const title = payload.title || 'Learnic';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon.svg',
    badge: '/icon.svg',
    tag: payload.tag,
    data: { url: payload.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(focusOrOpen(targetUrl));
});

async function focusOrOpen(url) {
  const allClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  // If a tab is already open on the same origin, focus it and
  // navigate. Otherwise spawn a new tab. Mirrors the canonical
  // notification-click pattern.
  const targetOrigin = self.location.origin;
  for (const client of allClients) {
    try {
      const clientUrl = new URL(client.url);
      if (clientUrl.origin === targetOrigin && 'focus' in client) {
        if ('navigate' in client && client.url !== url) {
          await client.navigate(url);
        }
        return client.focus();
      }
    } catch {
      // ignore malformed client URLs
    }
  }
  if (self.clients.openWindow) {
    return self.clients.openWindow(url);
  }
  return null;
}
