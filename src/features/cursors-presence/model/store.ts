import {
  STALE_AFTER_MS,
  type CursorAction,
  type CursorEntry,
  type FieldKey,
} from './types';

/**
 * In-memory store of every other user's cursor on the current
 * product. Lives behind `useSyncExternalStore` so React components
 * subscribe to a specific `fieldKey` and only re-render when that
 * key's set of entries actually changes.
 *
 * State shape:
 *   - `byUser: userId → CursorEntry` (one cursor per user)
 *   - `byField: fieldKey → readonly CursorEntry[]` (derived index)
 *
 * The byField index is rebuilt only when membership or any
 * entry's `action` changes — `useSyncExternalStore` compares the
 * snapshot by `Object.is`, so building a fresh array on every
 * heartbeat would trigger re-renders constantly. Heartbeats that
 * preserve `(fieldKey, action)` are coalesced in `applyCursorAt`
 * and never reach this layer.
 */
export class CursorsStore {
  private readonly byUser = new Map<string, CursorEntry>();
  private readonly byField = new Map<FieldKey, readonly CursorEntry[]>();
  private readonly fieldListeners = new Map<FieldKey, Set<() => void>>();
  private readonly userListeners = new Map<string, Set<() => void>>();
  private readonly anyListeners = new Set<() => void>();
  private activeKeysCache: readonly FieldKey[] | null = null;
  private activeUsersCache: readonly string[] | null = null;
  private staleTimer: ReturnType<typeof setInterval> | null = null;

  /** Start the periodic stale-eviction sweep. Idempotent. */
  start(): void {
    if (this.staleTimer !== null) return;
    // Sweep every ~3 s — much shorter than `STALE_AFTER_MS` so the
    // worst-case lag between a network drop and the ghost cursor
    // disappearing is bounded by the sweep cadence, not the stale
    // threshold.
    this.staleTimer = setInterval(() => this.evictStale(), 3_000);
  }

  /** Stop the stale sweep. Idempotent. */
  stop(): void {
    if (this.staleTimer !== null) {
      clearInterval(this.staleTimer);
      this.staleTimer = null;
    }
  }

  /** Wipe every entry — used on terminal channel close. */
  reset(): void {
    if (this.byUser.size === 0) return;
    const touchedFields = new Set<FieldKey>();
    const touchedUsers = new Set<string>();
    for (const entry of this.byUser.values()) {
      touchedFields.add(entry.fieldKey);
      touchedUsers.add(entry.userId);
    }
    this.byUser.clear();
    this.byField.clear();
    this.activeKeysCache = null;
    this.activeUsersCache = null;
    for (const fieldKey of touchedFields) this.notifyField(fieldKey);
    for (const userId of touchedUsers) this.notifyUser(userId);
    this.notifyAny();
  }

  /**
   * Apply the server's initial state. Called once per connect
   * with everyone-but-self's current cursors.
   */
  applySnapshot(
    entries: Array<{
      userId: string;
      fieldKey: FieldKey;
      action: CursorAction | null;
      updatedAt: string;
    }>,
  ): void {
    const touchedFields = new Set<FieldKey>();
    const touchedUsers = new Set<string>();
    for (const entry of this.byUser.values()) {
      touchedFields.add(entry.fieldKey);
      touchedUsers.add(entry.userId);
    }
    this.byUser.clear();
    this.byField.clear();
    this.activeKeysCache = null;
    this.activeUsersCache = null;
    const now = Date.now();
    for (const entry of entries) {
      const stored: CursorEntry = {
        userId: entry.userId,
        fieldKey: entry.fieldKey,
        action: entry.action,
        updatedAt: entry.updatedAt,
        updatedAtMs: now,
      };
      this.byUser.set(entry.userId, stored);
      touchedFields.add(entry.fieldKey);
      touchedUsers.add(entry.userId);
    }
    this.rebuildIndexFor(touchedFields);
    for (const fieldKey of touchedFields) this.notifyField(fieldKey);
    for (const userId of touchedUsers) this.notifyUser(userId);
    this.notifyAny();
  }

  /**
   * Replace (or insert) the entry for `userId`. If the user was
   * previously at a different field, the old entry is dropped and
   * both fields are notified.
   */
  applyCursorAt(entry: CursorEntry): void {
    const previous = this.byUser.get(entry.userId);
    this.byUser.set(entry.userId, entry);
    if (!previous) this.activeUsersCache = null;
    const touched = new Set<FieldKey>();
    if (previous && previous.fieldKey !== entry.fieldKey) {
      touched.add(previous.fieldKey);
    } else if (
      previous &&
      previous.action === entry.action &&
      previous.fieldKey === entry.fieldKey
    ) {
      // Same field, same action — heartbeat, nothing visible
      // changed. Still bump updatedAtMs above so eviction stays
      // correct, but skip notifying subscribers.
      return;
    }
    touched.add(entry.fieldKey);
    this.rebuildIndexFor(touched);
    for (const fieldKey of touched) this.notifyField(fieldKey);
    this.notifyUser(entry.userId);
    this.notifyAny();
  }

  /**
   * Drop the entry if it matches `(userId, fieldKey)`. A stale
   * `cursor_left` (the user already moved on) is a no-op.
   */
  applyCursorLeft(userId: string, fieldKey: FieldKey): void {
    const current = this.byUser.get(userId);
    if (!current || current.fieldKey !== fieldKey) return;
    this.byUser.delete(userId);
    this.activeUsersCache = null;
    this.rebuildIndexFor(new Set([fieldKey]));
    this.notifyField(fieldKey);
    this.notifyUser(userId);
    this.notifyAny();
  }

  /** Drop every entry for `userId`. Fired on `user_gone`. */
  applyUserGone(userId: string): void {
    const current = this.byUser.get(userId);
    if (!current) return;
    this.byUser.delete(userId);
    this.activeUsersCache = null;
    this.rebuildIndexFor(new Set([current.fieldKey]));
    this.notifyField(current.fieldKey);
    this.notifyUser(userId);
    this.notifyAny();
  }

  /**
   * Snapshot for `useSyncExternalStore`. Returns the SAME array
   * reference as long as nothing visible on `fieldKey` has
   * changed (membership stable, every entry's `action` stable) —
   * critical for avoiding render loops.
   */
  getEntriesAt(fieldKey: FieldKey): readonly CursorEntry[] {
    return this.byField.get(fieldKey) ?? EMPTY;
  }

  /**
   * Returns every fieldKey that currently has at least one user
   * on it. Used by the rendering layer to know which DOM nodes to
   * look up and render cursors over.
   */
  getActiveFieldKeys(): readonly FieldKey[] {
    if (this.byField.size === 0) return EMPTY_KEYS;
    if (this.activeKeysCache !== null) return this.activeKeysCache;
    // Iteration order of Map is insertion order, which is stable
    // across reads — fine for renderer's purposes.
    const keys = Array.from(this.byField.keys());
    this.activeKeysCache = keys;
    return keys;
  }

  /**
   * Returns every userId with a live cursor. Used by the renderer
   * to mount one `<CollaborationCursor>` per user — keyed by
   * userId so target-changes (a user hopping fields) keep the
   * same component instance alive, enabling spring transitions
   * across the gap.
   */
  getActiveUserIds(): readonly string[] {
    if (this.byUser.size === 0) return EMPTY_USERS;
    if (this.activeUsersCache !== null) return this.activeUsersCache;
    const ids = Array.from(this.byUser.keys());
    this.activeUsersCache = ids;
    return ids;
  }

  /** Snapshot for a specific user — `null` if they have no cursor. */
  getEntryForUser(userId: string): CursorEntry | null {
    return this.byUser.get(userId) ?? null;
  }

  /** Subscribe to changes affecting one specific user's entry. */
  subscribeUser(userId: string, listener: () => void): () => void {
    let listeners = this.userListeners.get(userId);
    if (!listeners) {
      listeners = new Set();
      this.userListeners.set(userId, listeners);
    }
    listeners.add(listener);
    return () => {
      const current = this.userListeners.get(userId);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) this.userListeners.delete(userId);
    };
  }

  /** Subscribe to changes for a specific field. */
  subscribeField(fieldKey: FieldKey, listener: () => void): () => void {
    let listeners = this.fieldListeners.get(fieldKey);
    if (!listeners) {
      listeners = new Set();
      this.fieldListeners.set(fieldKey, listeners);
    }
    listeners.add(listener);
    return () => {
      const current = this.fieldListeners.get(fieldKey);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) this.fieldListeners.delete(fieldKey);
    };
  }

  /** Subscribe to any store change — used by the rendering layer. */
  subscribeAny(listener: () => void): () => void {
    this.anyListeners.add(listener);
    return () => {
      this.anyListeners.delete(listener);
    };
  }

  private rebuildIndexFor(fieldKeys: Set<FieldKey>): void {
    let membershipChanged = false;
    for (const fieldKey of fieldKeys) {
      const wasPresent = this.byField.has(fieldKey);
      const entries: CursorEntry[] = [];
      for (const entry of this.byUser.values()) {
        if (entry.fieldKey === fieldKey) entries.push(entry);
      }
      const isPresent = entries.length > 0;
      if (wasPresent !== isPresent) membershipChanged = true;
      if (!isPresent) this.byField.delete(fieldKey);
      else this.byField.set(fieldKey, entries);
    }
    // Active-keys cache is keyed on membership only — invalidate
    // only when at least one field actually appeared or vanished.
    // Action-only updates leave the cache (and the layer's render
    // signal) alone.
    if (membershipChanged) this.activeKeysCache = null;
  }

  private notifyField(fieldKey: FieldKey): void {
    const listeners = this.fieldListeners.get(fieldKey);
    if (!listeners) return;
    for (const fn of listeners) fn();
  }

  private notifyUser(userId: string): void {
    const listeners = this.userListeners.get(userId);
    if (!listeners) return;
    for (const fn of listeners) fn();
  }

  private notifyAny(): void {
    for (const fn of this.anyListeners) fn();
  }

  private evictStale(): void {
    if (this.byUser.size === 0) return;
    const cutoff = Date.now() - STALE_AFTER_MS;
    const touchedFields = new Set<FieldKey>();
    const touchedUsers: string[] = [];
    for (const [userId, entry] of this.byUser) {
      if (entry.updatedAtMs < cutoff) {
        this.byUser.delete(userId);
        touchedFields.add(entry.fieldKey);
        touchedUsers.push(userId);
      }
    }
    if (touchedUsers.length === 0) return;
    this.activeUsersCache = null;
    this.rebuildIndexFor(touchedFields);
    for (const fieldKey of touchedFields) this.notifyField(fieldKey);
    for (const userId of touchedUsers) this.notifyUser(userId);
    this.notifyAny();
  }
}

// Stable empty-array sentinels for `useSyncExternalStore`
// snapshots — referential identity matters so consumers don't
// re-render on every store tick.
const EMPTY: readonly CursorEntry[] = Object.freeze([]);
const EMPTY_KEYS: readonly FieldKey[] = Object.freeze([]);
const EMPTY_USERS: readonly string[] = Object.freeze([]);
