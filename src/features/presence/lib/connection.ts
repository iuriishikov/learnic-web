import type {
  PresenceClientMessage,
  PresenceServerMessage,
  PresenceStatus,
} from '../model/types';

const WS_PATH = '/api/presence/ws';
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

type Listener = (status: PresenceStatus) => void;

type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

function resolveWsUrl(): string {
  if (typeof window === 'undefined') {
    throw new Error('PresenceConnection: cannot resolve WS URL on the server.');
  }
  const { protocol, host } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${WS_PATH}`;
}

export class PresenceConnection {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private listeners = new Map<string, Set<Listener>>();
  private subscriberCounts = new Map<string, number>();
  private cache = new Map<string, PresenceStatus>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;

  start(): void {
    this.stopped = false;
    if (this.state === 'connecting' || this.state === 'open') return;
    this.openSocket();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closeSocket(1000, 'client stopped');
    this.notifyAllOffline();
    this.cache.clear();
  }

  private closeSocket(code: number, reason: string): void {
    if (!this.ws) return;
    this.ws.onopen = null;
    this.ws.onmessage = null;
    this.ws.onerror = null;
    this.ws.onclose = null;
    try {
      this.ws.close(code, reason);
    } catch {
      // ignore
    }
    this.ws = null;
    this.state = 'closed';
  }

  private notifyAllOffline(): void {
    for (const [userId, listeners] of this.listeners) {
      const previous = this.cache.get(userId);
      if (previous === 'offline') continue;
      for (const fn of listeners) fn('offline');
    }
  }

  subscribe(userId: string, listener: Listener): () => void {
    let listeners = this.listeners.get(userId);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(userId, listeners);
    }
    listeners.add(listener);

    const next = (this.subscriberCounts.get(userId) ?? 0) + 1;
    this.subscriberCounts.set(userId, next);
    if (next === 1) {
      this.sendSubscribe([userId]);
    }

    const cached = this.cache.get(userId);
    if (cached) {
      queueMicrotask(() => listener(cached));
    }

    return () => this.unsubscribe(userId, listener);
  }

  getCached(userId: string): PresenceStatus | undefined {
    return this.cache.get(userId);
  }

  private unsubscribe(userId: string, listener: Listener): void {
    const listeners = this.listeners.get(userId);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(userId);
    }
    const remaining = (this.subscriberCounts.get(userId) ?? 1) - 1;
    if (remaining <= 0) {
      this.subscriberCounts.delete(userId);
      this.cache.delete(userId);
      this.sendUnsubscribe([userId]);
    } else {
      this.subscriberCounts.set(userId, remaining);
    }
  }

  private openSocket(): void {
    if (this.stopped) return;
    let url: string;
    try {
      url = resolveWsUrl();
    } catch (err) {
      console.warn('[presence]', err);
      return;
    }

    this.state = 'connecting';
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      console.warn('[presence] failed to construct WebSocket', err);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.state = 'open';
      this.reconnectAttempts = 0;
      const ids = Array.from(this.subscriberCounts.keys());
      if (ids.length > 0) this.sendSubscribe(ids);
    };

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onerror = () => {
      // The browser fires `error` before `close`; rely on `close` to reconnect.
    };

    ws.onclose = () => {
      this.ws = null;
      this.state = 'closed';
      if (this.stopped) return;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (this.stopped) return;
    if (this.reconnectTimer) return;
    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_MS,
    );
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  private handleMessage(raw: unknown): void {
    let msg: PresenceServerMessage | null = null;
    try {
      msg = typeof raw === 'string' ? (JSON.parse(raw) as PresenceServerMessage) : null;
    } catch {
      return;
    }
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return;

    if (msg.type === 'snapshot' && Array.isArray(msg.presences)) {
      for (const item of msg.presences) {
        if (item && typeof item.user_id === 'string' && isStatus(item.status)) {
          this.applyUpdate(item.user_id, item.status);
        }
      }
      return;
    }

    if (msg.type === 'presence' && typeof msg.user_id === 'string' && isStatus(msg.status)) {
      this.applyUpdate(msg.user_id, msg.status);
    }
  }

  private applyUpdate(userId: string, status: PresenceStatus): void {
    const previous = this.cache.get(userId);
    this.cache.set(userId, status);
    if (previous === status) return;
    const listeners = this.listeners.get(userId);
    if (!listeners) return;
    for (const fn of listeners) fn(status);
  }

  private sendSubscribe(ids: string[]): void {
    if (ids.length === 0) return;
    this.send({ type: 'subscribe', user_ids: ids });
  }

  private sendUnsubscribe(ids: string[]): void {
    if (ids.length === 0) return;
    this.send({ type: 'unsubscribe', user_ids: ids });
  }

  private send(message: PresenceClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      console.warn('[presence] failed to send message', err);
    }
  }
}

function isStatus(value: unknown): value is PresenceStatus {
  return value === 'online' || value === 'offline';
}
