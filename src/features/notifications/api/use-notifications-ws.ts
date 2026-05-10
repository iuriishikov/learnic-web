'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  parseDetails,
  type NotificationDetailsRaw,
} from '../kinds/registry';
import { toActor, type ActorRaw } from '../kinds/shared';
import type { Notification, NotificationPage } from '../model/types';

import { notificationsCountersKey, notificationsListKey } from './queries';

type ListData = {
  pages: NotificationPage[];
  pageParams: (string | null)[];
};

type RawNotification = {
  oid: string;
  kind: Notification['kind'];
  category: Notification['category'];
  actor: ActorRaw | null;
  created_at: string;
  read_at: string | null;
  details: NotificationDetailsRaw;
};

type RawEnvelope =
  | { kind: 'created'; notification: RawNotification | null }
  | { kind: 'updated'; notification: RawNotification }
  | { kind: 'read'; notification_id: string }
  | { kind: 'read_all' };

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const TERMINAL_CLOSE_CODES = new Set([4401, 4403]);

function toNotification(raw: RawNotification): Notification {
  return {
    oid: raw.oid,
    kind: raw.kind,
    category: raw.category,
    actor: raw.actor ? toActor(raw.actor) : null,
    createdAt: raw.created_at,
    readAt: raw.read_at,
    details: parseDetails(raw.details),
  };
}

/**
 * Subscribe to the per-user notification WebSocket channel and patch the
 * TanStack Query cache on every delta. Mirrors the events-channel pattern
 * already used for product-content; lighter because the recipient is
 * inferred from the access cookie (no path parameter).
 *
 * Activation is gated by `enabled` so the panel can defer the WS handshake
 * until the user actually opens the bell — every signed-in user does not
 * need an open socket all the time.
 */
export function useNotificationsWebSocket(enabled: boolean): void {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let stopped = false;

    function open(): void {
      if (stopped) return;
      const { protocol, host } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      // Routed through the Next.js `/api/...` rewrite so the
      // httpOnly access cookie (scoped to the frontend host) reaches
      // the backend on the WS handshake — the same pattern used by
      // the presence and product-events sockets.
      const url = `${wsProtocol}//${host}/api/users/me/notifications/ws`;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data) as RawEnvelope;
        } catch {
          return;
        }
        applyEnvelope(parsed as RawEnvelope);
      };
      ws.onclose = (closeEvent) => {
        ws = null;
        if (stopped) return;
        if (TERMINAL_CLOSE_CODES.has(closeEvent.code)) {
          stopped = true;
          return;
        }
        scheduleReconnect();
      };
      ws.onopen = () => {
        reconnectAttempts = 0;
      };
    }

    function scheduleReconnect(): void {
      if (stopped || reconnectTimer) return;
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttempts,
        RECONNECT_MAX_MS,
      );
      reconnectAttempts += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        open();
      }, delay);
    }

    function applyEnvelope(env: RawEnvelope): void {
      if (env.kind === 'created' && env.notification) {
        const notification = toNotification(env.notification);
        prependToLists(qc, notification);
        qc.invalidateQueries({ queryKey: notificationsCountersKey() });
        return;
      }
      if (env.kind === 'updated') {
        const notification = toNotification(env.notification);
        replaceInLists(qc, notification);
        return;
      }
      if (env.kind === 'read') {
        markListsRead(qc, env.notification_id);
        qc.invalidateQueries({ queryKey: notificationsCountersKey() });
        return;
      }
      if (env.kind === 'read_all') {
        markListsAllRead(qc);
        qc.invalidateQueries({ queryKey: notificationsCountersKey() });
      }
    }

    open();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try {
          ws.close(1000, 'effect cleanup');
        } catch {
          // ignore
        }
      }
    };
  }, [enabled, qc]);
}

function prependToLists(
  qc: ReturnType<typeof useQueryClient>,
  notification: Notification,
): void {
  const targets: (Notification['category'] | null)[] = [
    null,
    notification.category,
  ];
  for (const category of targets) {
    qc.setQueryData<ListData>(notificationsListKey(category), (old) => {
      if (!old) return old;
      const [first, ...rest] = old.pages;
      if (!first) return old;
      const exists = first.items.some((n) => n.oid === notification.oid);
      if (exists) return old;
      const updated: NotificationPage = {
        ...first,
        items: [notification, ...first.items],
      };
      return { ...old, pages: [updated, ...rest] };
    });
  }
}

function replaceInLists(
  qc: ReturnType<typeof useQueryClient>,
  notification: Notification,
): void {
  qc.setQueriesData<ListData>(
    { queryKey: ['notifications', 'list'] },
    (old) => {
      if (!old) return old;
      let touched = false;
      const pages = old.pages.map((page) => {
        const items = page.items.map((n) => {
          if (n.oid !== notification.oid) return n;
          touched = true;
          return notification;
        });
        return touched ? { ...page, items } : page;
      });
      if (!touched) return old;
      return { ...old, pages };
    },
  );
}

function markListsRead(
  qc: ReturnType<typeof useQueryClient>,
  notificationId: string,
): void {
  const now = new Date().toISOString();
  qc.setQueriesData<ListData>(
    { queryKey: ['notifications', 'list'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((n) =>
            n.oid === notificationId && n.readAt === null
              ? ({ ...n, readAt: now } as Notification)
              : n,
          ),
        })),
      };
    },
  );
}

function markListsAllRead(qc: ReturnType<typeof useQueryClient>): void {
  const now = new Date().toISOString();
  qc.setQueriesData<ListData>(
    { queryKey: ['notifications', 'list'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((n) =>
            n.readAt === null ? ({ ...n, readAt: now } as Notification) : n,
          ),
        })),
      };
    },
  );
}
