/**
 * Author-side push channel for product / course events.
 *
 * Wire format and close-code conventions are spelt out in the OpenAPI spec
 * under the "WebSocket channels" section of `info.description` (OpenAPI 3
 * doesn't model WebSockets, so the contract lives there as prose):
 *
 *   - `4401` — missing or denied access cookie. Terminal.
 *   - `4403` — authenticated but not authorised. Terminal.
 *   - `4404` — wrong resource (e.g. opening course channel on a webinar). Terminal.
 *
 * The server does not buffer events. When the socket reopens after an
 * unexpected drop, the client must refetch initial state via REST — events
 * emitted while disconnected are lost. We surface that via the
 * `onReconnected` callback.
 */
export type EventEnvelope<TKind extends string = string> = {
  kind: TKind;
  product_id: string;
  actor_id: string;
  payload: Record<string, unknown>;
  occurred_at: string;
};

export type EventsChannelOptions<TKind extends string> = {
  /** Same-origin URL Next.js proxies to the API host. */
  url: string;
  onEvent: (event: EventEnvelope<TKind>) => void;
  /**
   * Fired after a *re-*connect (i.e. the socket dropped and came back), not
   * on the very first open. Consumers should refetch initial state — server
   * does no event replay.
   */
  onReconnected?: () => void;
  /** Fired when the channel hits a terminal close code and won't retry. */
  onTerminalClose?: (code: number) => void;
};

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const TERMINAL_CLOSE_CODES = new Set([4401, 4403, 4404]);

type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

export class EventsChannel<TKind extends string = string> {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'idle';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = true;
  /** Becomes true after the first successful open — used to gate
   *  `onReconnected` so the very first connection doesn't fire it. */
  private hasConnected = false;

  constructor(private readonly opts: EventsChannelOptions<TKind>) {}

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
      console.warn('[events-channel] failed to construct WebSocket', err);
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
      // The browser fires `error` before `close`; rely on `close` to react.
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
    if (!isEnvelope(parsed)) return;
    this.opts.onEvent(parsed as EventEnvelope<TKind>);
  }
}

function isEnvelope(value: unknown): value is EventEnvelope {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.kind === 'string' &&
    typeof v.product_id === 'string' &&
    typeof v.actor_id === 'string' &&
    typeof v.occurred_at === 'string' &&
    typeof v.payload === 'object' &&
    v.payload !== null
  );
}
