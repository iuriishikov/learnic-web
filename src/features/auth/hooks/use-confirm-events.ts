'use client';

import { useEffect, useRef } from 'react';

/**
 * Subscribe to ``WS /users/me/confirm-events`` and react to a single
 * ``purpose`` push.
 *
 * Why a hook: the channel is push-only and short-lived per surface
 * (open before initiator action, close on confirmed / unmount). One
 * connection per page; reconnect handled below.
 *
 * The cookie carrying the user identity (`accessCookie` or
 * `signupSessionCookie`) is HttpOnly and same-origin, so we route
 * through `/api/users/me/confirm-events` — Next.js proxies the
 * Upgrade request and forwards the cookie.
 *
 * No replay buffer on the server. After a `(re)connect` the consumer
 * is responsible for refetching state via REST — this hook calls
 * `onReconnected` so the caller can do that.
 */

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const TERMINAL_CLOSE_CODES = new Set([4401]);

type ConfirmEnvelope = { kind: string; purpose: string };

export type UseConfirmEventsOptions = {
  /**
   * Filter — fire ``onConfirmed`` only for this ``purpose`` value.
   * Mirrors backend ``EmailTokenPurpose`` (e.g. ``"verify"``).
   */
  purpose: string;
  /** When ``false`` the hook does not open the socket. */
  enabled?: boolean;
  onConfirmed: () => void;
  /**
   * Fired after a re-connect (not the first open). Caller should
   * refetch state via REST since the server does not buffer events.
   */
  onReconnected?: () => void;
  /**
   * Fired when the channel hits a terminal close (e.g. ``4401`` —
   * cookie missing/expired) and won't retry.
   */
  onTerminalClose?: (code: number) => void;
};

export function useConfirmEvents({
  purpose,
  enabled = true,
  onConfirmed,
  onReconnected,
  onTerminalClose,
}: UseConfirmEventsOptions): void {
  // Mutable ref-bag so we can read latest callbacks inside socket
  // handlers without re-running the connection effect on every
  // render. The ref is updated in its own effect so we never write
  // refs during render (react-hooks/refs).
  const callbacksRef = useRef({ onConfirmed, onReconnected, onTerminalClose });
  useEffect(() => {
    callbacksRef.current = { onConfirmed, onReconnected, onTerminalClose };
  }, [onConfirmed, onReconnected, onTerminalClose]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === 'undefined') return;

    let stopped = false;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    let hasConnected = false;

    const url = (() => {
      const { protocol, host } = window.location;
      const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${host}/api/users/me/confirm-events`;
    })();

    function scheduleReconnect() {
      if (stopped) return;
      if (reconnectTimer) return;
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

    function open() {
      if (stopped) return;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      ws.onopen = () => {
        reconnectAttempts = 0;
        const wasReconnect = hasConnected;
        hasConnected = true;
        if (wasReconnect) callbacksRef.current.onReconnected?.();
      };
      ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        let parsed: unknown;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
        if (!isEnvelope(parsed)) return;
        if (parsed.kind === 'confirmed' && parsed.purpose === purpose) {
          callbacksRef.current.onConfirmed();
        }
      };
      ws.onerror = () => {
        // Browser fires `error` before `close`; rely on `close`.
      };
      ws.onclose = (closeEvent) => {
        ws = null;
        if (stopped) return;
        if (TERMINAL_CLOSE_CODES.has(closeEvent.code)) {
          stopped = true;
          callbacksRef.current.onTerminalClose?.(closeEvent.code);
          return;
        }
        scheduleReconnect();
      };
    }

    open();

    return () => {
      stopped = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        try {
          ws.close(1000, 'unmount');
        } catch {
          // ignore
        }
        ws = null;
      }
    };
  }, [enabled, purpose]);
}

function isEnvelope(value: unknown): value is ConfirmEnvelope {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.kind === 'string' && typeof v.purpose === 'string';
}
