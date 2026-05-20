import type {
  CursorsClientMessage,
  CursorsServerMessage,
} from '../model/types';

/**
 * WebSocket transport for the cursors channel. Same shape /
 * lifecycle as `features/products/lib/events-channel`, but
 * narrowly typed and not generic — there is only one wire schema
 * for cursors.
 *
 * The channel is dumb on purpose: it owns the socket lifecycle
 * (open / reconnect / terminal close), serializes outgoing
 * messages, parses incoming ones, and surfaces both to the owner
 * via callbacks. State management lives in the store; republish
 * on reconnect lives in the provider.
 */

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const TERMINAL_CLOSE_CODES = new Set([4401, 4403, 4404]);

type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

export type CursorsChannelOptions = {
  /** Same-origin URL; Next.js proxies WebSocket upgrades. */
  url: string;
  onMessage: (message: CursorsServerMessage) => void;
  /**
   * Fires on every reopen that is not the very first one.
   * The provider re-publishes the caller's current cursor here.
   */
  onReconnected?: () => void;
  onTerminalClose?: (code: number) => void;
};

export class CursorsChannel {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  private hasConnected = false;

  constructor(private readonly opts: CursorsChannelOptions) {}

  start(): void {
    if (typeof window === 'undefined') return;
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
  }

  /** Fire-and-forget send. Drops the message if the socket isn't open. */
  send(message: CursorsClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    try {
      this.ws.send(JSON.stringify(message));
    } catch (err) {
      console.error('[cursors-channel] send failed', err);
    }
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

  private openSocket(): void {
    if (this.stopped) return;

    this.state = 'connecting';
    let ws: WebSocket;
    try {
      ws = new WebSocket(this.resolveUrl());
    } catch (err) {
      console.error('[cursors-channel] failed to construct WebSocket', err);
      this.scheduleReconnect();
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.state = 'open';
      this.reconnectAttempts = 0;
      const wasReconnect = this.hasConnected;
      this.hasConnected = true;
      if (wasReconnect) this.opts.onReconnected?.();
    };

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onerror = () => {
      // The browser fires `error` immediately before `close`;
      // rely on `close` to react.
    };

    ws.onclose = (closeEvent) => {
      this.ws = null;
      this.state = 'closed';
      if (this.stopped) return;
      if (TERMINAL_CLOSE_CODES.has(closeEvent.code)) {
        this.stopped = true;
        this.opts.onTerminalClose?.(closeEvent.code);
        return;
      }
      this.scheduleReconnect();
    };
  }

  private resolveUrl(): string {
    const { protocol, host } = window.location;
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${host}${this.opts.url}`;
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
    if (typeof raw !== 'string') return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!isServerMessage(parsed)) return;
    this.opts.onMessage(parsed);
  }
}

function isServerMessage(value: unknown): value is CursorsServerMessage {
  if (!value || typeof value !== 'object') return false;
  const v = value as { type?: unknown };
  return (
    v.type === 'snapshot' ||
    v.type === 'cursor_at' ||
    v.type === 'cursor_left' ||
    v.type === 'user_gone'
  );
}
