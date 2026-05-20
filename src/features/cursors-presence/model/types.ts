/**
 * Field-key taxonomy is owned by callers (the editor screen),
 * never by the wire layer. Convention is dotted lowercase with
 * stable ids — `product.title`, `lesson.<id>.title`,
 * `block.<id>.option.<idx>`, etc. The server treats the string as
 * opaque; only the SPA gives it meaning.
 */
export type FieldKey = string;

/**
 * Action string carried with every `cursor_at`. The convention is
 * an English snake_case-ish code (`editing`, `typing`, `viewing`,
 * `commenting`) so receivers can localize on display. The wire
 * accepts any string; unknown codes fall back to the literal.
 */
export type CursorAction = string;

/** Frozen on-the-wire delta from the server. */
export type CursorsServerMessage =
  | {
      type: 'snapshot';
      cursors: Array<{
        user_id: string;
        field_id: string;
        action: CursorAction | null;
        updated_at: string;
      }>;
    }
  | {
      type: 'cursor_at';
      user_id: string;
      field_id: string;
      action: CursorAction | null;
      updated_at: string;
    }
  | {
      type: 'cursor_left';
      user_id: string;
      field_id: string;
    }
  | {
      type: 'user_gone';
      user_id: string;
    };

/** Frozen on-the-wire delta from the client. */
export type CursorsClientMessage =
  | {
      type: 'cursor_at';
      field_id: string;
      action: CursorAction | null;
    }
  | {
      type: 'cursor_left';
      field_id: string;
    };

/**
 * Local in-memory cursor entry. One per user (latest tab wins on
 * the server side, so the store only ever holds one row per id).
 * `updatedAtMs` is a client-side millisecond timestamp used by the
 * stale-eviction timer; `updatedAt` is the ISO string the server
 * sent, preserved verbatim so the UI can render absolute times if
 * it wants.
 */
export type CursorEntry = {
  userId: string;
  fieldKey: FieldKey;
  action: CursorAction | null;
  updatedAt: string;
  updatedAtMs: number;
};

/**
 * Stale-evict thresholds. The server's own stale window is 30 s;
 * we evict client-side at 15 s so a brief network hiccup doesn't
 * leave a "ghost" cursor visible while the server's own cleanup is
 * still pending.
 */
export const STALE_AFTER_MS = 15_000;

/**
 * Heartbeat cadence for `cursor_at` republish while the user stays
 * on the same field. Picked so the client's last-seen is refreshed
 * twice per server-side stale window.
 */
export const HEARTBEAT_INTERVAL_MS = 10_000;

/**
 * Throttle floor for outgoing `cursor_at` messages on the same
 * (field, action) tuple. Typing produces an input event per
 * keystroke; we coalesce.
 */
export const PUBLISH_THROTTLE_MS = 250;

/**
 * Idle window after the last `input` event before reverting an
 * `editing → typing` transition back to `editing`. Picked so a
 * burst of keystrokes registers as continuous typing but a real
 * pause flips back to "editing" within roughly one breath.
 */
export const TYPING_IDLE_MS = 1_000;
