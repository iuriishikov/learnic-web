'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { type MySubscription } from '../model/subscription';
import {
  fromStorageQuotaEnvelope,
  isStorageQuotaEnvelope,
  type StorageQuota,
} from '../model/storage-quota';

import { mySubscriptionKey } from './use-my-subscription';

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
// 4401 = auth failure on the WS handshake. Terminal — never retry.
const TERMINAL_CLOSE_CODES = new Set([4401]);

/**
 * Subscribe to the per-user storage-quota WebSocket channel
 * (`WS /users/me/storage`) and expose the latest snapshot.
 *
 * Every message is a FULL snapshot, never a delta — a `snapshot`
 * arrives right after connect (and after every reconnect), so no REST
 * bootstrap is needed. Out-of-order pushes are dropped by comparing
 * `occurred_at` against the last applied envelope.
 *
 * As a side effect the hook also patches the `my-subscription` query
 * cache so `SubscriptionCard` stays in sync with live usage without its
 * own poll having to fire.
 *
 * Mount this in an ALWAYS-MOUNTED ancestor (e.g. the user-menu root in
 * the app header) and pass the result down — never inside popup/dropdown
 * content, which unmounts on close and would reopen the socket on every
 * open. `enabled` gates activation for conditional surfaces.
 *
 * Mirrors the lifecycle/backoff conventions of the notifications WS.
 */
export function useStorageQuotaWs(enabled = true): StorageQuota | null {
  const qc = useQueryClient();
  const [quota, setQuota] = useState<StorageQuota | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let stopped = false;
    // Newest applied timestamp — guards against out-of-order delivery.
    let lastAppliedAt: string | null = null;

    function open(): void {
      if (stopped) return;
      const { protocol, host } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      // Routed through the Next.js `/api/...` rewrite so the httpOnly
      // access cookie (scoped to the frontend host) reaches the backend
      // on the WS handshake — same pattern as the notifications socket.
      const url = `${wsProtocol}//${host}/api/users/me/storage`;
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
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!isStorageQuotaEnvelope(parsed)) return;
        applyQuota(fromStorageQuotaEnvelope(parsed));
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

    function applyQuota(next: StorageQuota): void {
      // Drop envelopes that are older than the one already applied.
      if (lastAppliedAt !== null && next.occurredAt < lastAppliedAt) return;
      lastAppliedAt = next.occurredAt;
      setQuota(next);
      // Keep the SubscriptionCard's cache fresh — same numbers, no poll.
      qc.setQueryData<MySubscription | null>(mySubscriptionKey, (old) =>
        old
          ? {
              ...old,
              used: { storageBytes: next.usedBytes },
              plan: {
                ...old.plan,
                limits: { storageBytesMax: next.maxBytes },
              },
            }
          : old,
      );
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
      // Forget the last snapshot on teardown so a re-enable (e.g. the user
      // regains a released product) can't flash stale usage before the
      // fresh socket delivers its first frame. Runs only for an enabled
      // cycle — the early `return` above registers no cleanup when disabled.
      setQuota(null);
    };
  }, [enabled, qc]);

  return quota;
}
