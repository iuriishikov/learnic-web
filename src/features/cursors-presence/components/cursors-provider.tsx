'use client';

import * as React from 'react';

import { useAuth } from '@/shared/auth';

import { CursorsChannel } from '../lib/cursors-channel';
import { CursorsStore } from '../model/store';
import {
  HEARTBEAT_INTERVAL_MS,
  PUBLISH_THROTTLE_MS,
  TYPING_IDLE_MS,
  type CursorAction,
  type FieldKey,
} from '../model/types';

type ProviderValue = {
  store: CursorsStore;
  publishEnter: (fieldKey: FieldKey, action?: CursorAction) => void;
  publishLeave: (fieldKey: FieldKey) => void;
};

const CursorsContext = React.createContext<ProviderValue | null>(null);

type CursorsProviderProps = {
  productId: string;
  enabled?: boolean;
  children: React.ReactNode;
};

const DEFAULT_ACTION: CursorAction = 'editing';
const TYPING_ACTION: CursorAction = 'typing';

const FOCUSABLE_ATTR = 'data-cursor-target';
const ACTION_ATTR = 'data-cursor-action';
// Marker attribute on portaled / floating UI that logically belongs to a
// tracked field (TipTap BubbleMenu, color popovers, font pickers, link
// editors, etc.). When focus moves to an element under this attribute,
// `publishLeave` is suppressed — the user is still "at" the same field
// even though the DOM focus chain doesn't include the field's wrapper.
const KEEPALIVE_ATTR = 'data-cursor-keepalive';

/**
 * Owns the cursors channel + store lifecycle for one product.
 *
 * Sets up two layers of behaviour:
 *
 * 1. **Transport** — opens the WS, fans server messages into the
 *    store, and republishes the caller's own cursor on reconnect.
 * 2. **Auto-publish** — installs document-level `focusin` /
 *    `focusout` / `input` listeners and walks
 *    `event.target.closest('[data-cursor-target]')` to find the
 *    field key. Any focusable element with that attribute gets
 *    tracked; the optional `data-cursor-action` overrides the
 *    default `'editing'` action.
 *
 * Typing detection: while the active action is `'editing'`, an
 * `input` event flips it to `'typing'` and arms a 1 s idle timer
 * that flips back to `'editing'`. Non-editing actions
 * (`'viewing'`, `'commenting'`) stay as configured — typing-burst
 * UX only makes sense over edit-y fields.
 */
export function CursorsProvider({
  productId,
  enabled = true,
  children,
}: CursorsProviderProps) {
  const { user } = useAuth();
  const currentUserId = user?.oid ?? null;

  const [store] = React.useState(() => new CursorsStore());

  // Stable refs for the focus-delegation handlers so the document
  // listeners see the latest `currentField` / `publishEnter` /
  // `publishLeave` without re-attaching listeners on every render.
  const channelRef = React.useRef<CursorsChannel | null>(null);
  const activeFieldRef = React.useRef<FieldKey | null>(null);
  const activeActionRef = React.useRef<CursorAction>(DEFAULT_ACTION);
  const baseActionRef = React.useRef<CursorAction>(DEFAULT_ACTION);
  const lastPublishRef = React.useRef<{
    fieldKey: FieldKey;
    action: CursorAction | null;
    at: number;
  } | null>(null);
  const heartbeatTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const typingIdleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Deferred `cursor_left` send. Two reasons to defer instead of
  // sending immediately:
  //
  // 1. A→B field transitions on click fire `focusout(A)` and
  //    `focusin(B)` in the same event-loop tick. The grace lets the
  //    later `publishEnter(B)` cancel the leave, so the receiver sees a
  //    single `cursor_at(B)` delta (smooth spring transition) instead
  //    of a `cursor_left(A)` + `cursor_at(B)` pair (unmount + remount).
  //
  // 2. Tippy / Floating-UI based popovers (TipTap BubbleMenu, etc.)
  //    that live in a portal use `data-cursor-keepalive` to short-circuit
  //    the leave on focusout, so the grace is not strictly required for
  //    them; this is just defence in depth.
  //
  // 200ms is far longer than a same-tick focus shuffle but short enough
  // that "user clicked outside" feels responsive — the cursor
  // disappears in well under a quarter second.
  const pendingLeaveRef = React.useRef<{
    fieldKey: FieldKey;
    handle: ReturnType<typeof setTimeout>;
  } | null>(null);
  const LEAVE_GRACE_MS = 200;

  const cancelPendingLeave = React.useCallback(() => {
    if (pendingLeaveRef.current) {
      clearTimeout(pendingLeaveRef.current.handle);
      pendingLeaveRef.current = null;
    }
  }, []);

  const flushPendingLeave = React.useCallback(() => {
    const pending = pendingLeaveRef.current;
    if (!pending) return;
    clearTimeout(pending.handle);
    pendingLeaveRef.current = null;
    // Mirror the timer's full teardown — flush is called from
    // visibility/unload paths where there's no chance of a follow-up
    // `publishEnter`, so the cursor must be torn down fully.
    if (activeFieldRef.current === pending.fieldKey) {
      activeFieldRef.current = null;
      baseActionRef.current = DEFAULT_ACTION;
      activeActionRef.current = DEFAULT_ACTION;
    }
    if (heartbeatTimerRef.current !== null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    channelRef.current?.send({
      type: 'cursor_left',
      field_id: pending.fieldKey,
    });
  }, []);

  const sendCursorAt = React.useCallback(
    (fieldKey: FieldKey, action: CursorAction | null, force = false) => {
      const channel = channelRef.current;
      if (!channel) return;
      const last = lastPublishRef.current;
      const now = Date.now();
      if (
        !force &&
        last &&
        last.fieldKey === fieldKey &&
        last.action === action &&
        now - last.at < PUBLISH_THROTTLE_MS
      ) {
        return;
      }
      lastPublishRef.current = { fieldKey, action, at: now };
      channel.send({ type: 'cursor_at', field_id: fieldKey, action });
    },
    [],
  );

  const clearTypingTimer = React.useCallback(() => {
    if (typingIdleTimerRef.current !== null) {
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
  }, []);

  const stopHeartbeat = React.useCallback(() => {
    if (heartbeatTimerRef.current !== null) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const startHeartbeat = React.useCallback(() => {
    stopHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      const fieldKey = activeFieldRef.current;
      if (!fieldKey) return;
      sendCursorAt(fieldKey, activeActionRef.current, true);
    }, HEARTBEAT_INTERVAL_MS);
  }, [sendCursorAt, stopHeartbeat]);

  const publishEnter = React.useCallback(
    (fieldKey: FieldKey, action: CursorAction = DEFAULT_ACTION) => {
      // Coming back to the editor from a non-tracked element (button,
      // menu, scrollbar) or hopping straight to another tracked field —
      // either way, the pending leave from the previous focusout is
      // moot. Cancel it BEFORE sending the new `cursor_at` so receivers
      // see a single delta. The server overwrites the user's entry on
      // `cursor_at`, so the old field implicitly clears without an
      // explicit `cursor_left`.
      cancelPendingLeave();
      clearTypingTimer();
      activeFieldRef.current = fieldKey;
      baseActionRef.current = action;
      activeActionRef.current = action;
      sendCursorAt(fieldKey, action, true);
      startHeartbeat();
    },
    [cancelPendingLeave, clearTypingTimer, sendCursorAt, startHeartbeat],
  );

  const publishLeave = React.useCallback(
    (fieldKey: FieldKey) => {
      const current = activeFieldRef.current;
      if (current !== fieldKey) return;
      // Drop the typing flag so the cursor goes back to its base action
      // (editing / viewing / commenting) instead of looking like the user
      // is mid-keystroke while they're picking a font.
      activeActionRef.current = baseActionRef.current;
      clearTypingTimer();
      // DO NOT clear activeFieldRef or stop the heartbeat here. The user
      // may have just popped open a portaled dropdown that's logically
      // part of this field; heartbeat refreshes keep the cursor alive on
      // receivers throughout. The full teardown (clear ref, stop
      // heartbeat, send `cursor_left`) happens only if the grace timer
      // below actually fires.
      cancelPendingLeave();
      const handle = setTimeout(() => {
        pendingLeaveRef.current = null;
        if (activeFieldRef.current !== fieldKey) return;
        activeFieldRef.current = null;
        baseActionRef.current = DEFAULT_ACTION;
        activeActionRef.current = DEFAULT_ACTION;
        stopHeartbeat();
        channelRef.current?.send({
          type: 'cursor_left',
          field_id: fieldKey,
        });
      }, LEAVE_GRACE_MS);
      pendingLeaveRef.current = { fieldKey, handle };
    },
    [cancelPendingLeave, clearTypingTimer, stopHeartbeat],
  );

  // Channel lifecycle. Re-opens on productId / enabled change.
  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const channel = new CursorsChannel({
      url: `/api/products/${encodeURIComponent(productId)}/cursors`,
      onMessage: (msg) => {
        if (msg.type === 'snapshot') {
          store.applySnapshot(
            msg.cursors.map((c) => ({
              userId: c.user_id,
              fieldKey: c.field_id,
              action: c.action,
              updatedAt: c.updated_at,
            })),
          );
        } else if (msg.type === 'cursor_at') {
          store.applyCursorAt({
            userId: msg.user_id,
            fieldKey: msg.field_id,
            action: msg.action,
            updatedAt: msg.updated_at,
            updatedAtMs: Date.now(),
          });
        } else if (msg.type === 'cursor_left') {
          store.applyCursorLeft(msg.user_id, msg.field_id);
        } else if (msg.type === 'user_gone') {
          store.applyUserGone(msg.user_id);
        }
      },
      onReconnected: () => {
        // Re-tell the server where we are after a drop.
        const fieldKey = activeFieldRef.current;
        if (!fieldKey) return;
        sendCursorAt(fieldKey, activeActionRef.current, true);
      },
      onTerminalClose: (code) => {
        console.error('[cursors] terminal close', code);
        store.reset();
      },
    });

    channelRef.current = channel;
    store.start();
    channel.start();

    return () => {
      channel.stop();
      store.stop();
      store.reset();
      stopHeartbeat();
      clearTypingTimer();
      cancelPendingLeave();
      channelRef.current = null;
      activeFieldRef.current = null;
      lastPublishRef.current = null;
    };
  }, [
    enabled,
    productId,
    store,
    sendCursorAt,
    stopHeartbeat,
    clearTypingTimer,
    cancelPendingLeave,
  ]);

  // Document-level focus / input delegation. One set of listeners
  // for the entire editor — every `[data-cursor-target]` is picked
  // up automatically.
  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;

    function resolveField(target: EventTarget | null): {
      fieldKey: FieldKey;
      action: CursorAction;
    } | null {
      if (!(target instanceof Element)) return null;
      const el = target.closest(`[${FOCUSABLE_ATTR}]`);
      if (!el) return null;
      const fieldKey = el.getAttribute(FOCUSABLE_ATTR);
      if (!fieldKey) return null;
      const action =
        el.getAttribute(ACTION_ATTR)?.trim() ?? DEFAULT_ACTION;
      return { fieldKey, action: action || DEFAULT_ACTION };
    }

    function isInsideKeepalive(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false;
      return target.closest(`[${KEEPALIVE_ATTR}]`) !== null;
    }

    function handleFocusIn(event: FocusEvent) {
      // Focus landing on a keepalive zone (a portaled toolbar /
      // popover / floating menu that belongs to the current field):
      // cancel any pending leave that was scheduled by the
      // focusout off the field itself, but do NOT publish a new
      // `cursor_at` — the user hasn't moved fields, they're just
      // interacting with editor chrome.
      if (isInsideKeepalive(event.target)) {
        cancelPendingLeave();
        return;
      }
      const resolved = resolveField(event.target);
      if (!resolved) return;
      publishEnter(resolved.fieldKey, resolved.action);
    }

    function handleFocusOut(event: FocusEvent) {
      const resolved = resolveField(event.target);
      if (!resolved) return;
      if (activeFieldRef.current !== resolved.fieldKey) return;
      // If the new focus lands on a keepalive zone (e.g. TipTap
      // BubbleMenu opened from this editor), suppress the leave —
      // the user is still on this field, the toolbar just happens
      // to live in a portal outside the data-cursor-target ancestor
      // chain.
      if (isInsideKeepalive(event.relatedTarget)) return;
      publishLeave(resolved.fieldKey);
    }

    function handleInput(event: Event) {
      const resolved = resolveField(event.target);
      if (!resolved) return;
      if (activeFieldRef.current !== resolved.fieldKey) return;
      // Typing transition only meaningful when the base action is
      // 'editing'. `viewing`, `commenting`, etc. stay verbatim —
      // the SPA can build dedicated "typing-comment" actions when
      // it wants finer-grained semantics.
      if (baseActionRef.current !== DEFAULT_ACTION) return;
      if (activeActionRef.current !== TYPING_ACTION) {
        activeActionRef.current = TYPING_ACTION;
        sendCursorAt(resolved.fieldKey, TYPING_ACTION);
      }
      clearTypingTimer();
      typingIdleTimerRef.current = setTimeout(() => {
        typingIdleTimerRef.current = null;
        if (
          activeFieldRef.current !== resolved.fieldKey ||
          activeActionRef.current !== TYPING_ACTION
        ) {
          return;
        }
        activeActionRef.current = baseActionRef.current;
        sendCursorAt(resolved.fieldKey, baseActionRef.current, true);
      }, TYPING_IDLE_MS);
    }

    function handleVisibility() {
      if (document.visibilityState !== 'hidden') return;
      const fieldKey = activeFieldRef.current;
      if (fieldKey) publishLeave(fieldKey);
      // The deferred leave never fires once the tab is hidden — flush it
      // synchronously so the server hears about the blur immediately.
      flushPendingLeave();
    }

    function handleBeforeUnload() {
      const fieldKey = activeFieldRef.current;
      if (fieldKey) {
        channelRef.current?.send({
          type: 'cursor_left',
          field_id: fieldKey,
        });
      }
      flushPendingLeave();
    }

    function handlePointerDown(event: PointerEvent) {
      // Browsers only move focus on click when the click target is
      // focusable. A click on a plain <div>, blank card surface, or
      // non-focusable wrapper doesn't blur the active input, so
      // `focusout` never fires and `publishLeave` is never reached
      // through focus events. This handler covers that gap.
      const fieldKey = activeFieldRef.current;
      if (!fieldKey) return;
      if (!(event.target instanceof Element)) return;
      const target = event.target;
      // Keepalive zones (BubbleMenu, cursor portal) always stay.
      if (target.closest(`[${KEEPALIVE_ATTR}]`)) return;
      // Only the ACTIVE field's own wrapper counts as "still here" —
      // clicking inside a *different* tracked field's wrapper (where
      // focus may not have moved, because the wrapper itself isn't
      // focusable) must trigger a leave, otherwise the cursor sticks
      // to the old field forever.
      const trackedAncestor = target.closest(`[${FOCUSABLE_ATTR}]`);
      if (
        trackedAncestor &&
        trackedAncestor.getAttribute(FOCUSABLE_ATTR) === fieldKey
      ) {
        return;
      }
      publishLeave(fieldKey);
    }

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('input', handleInput, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    enabled,
    publishEnter,
    publishLeave,
    sendCursorAt,
    clearTypingTimer,
    flushPendingLeave,
    cancelPendingLeave,
  ]);

  const value = React.useMemo<ProviderValue>(
    () => ({ store, publishEnter, publishLeave }),
    [store, publishEnter, publishLeave],
  );

  void currentUserId; // currently only used by hooks; reserved for future self-filter

  return (
    <CursorsContext.Provider value={value}>{children}</CursorsContext.Provider>
  );
}

/** Internal — exposed to hooks in this feature only. */
export function useCursorsContext(): ProviderValue | null {
  return React.useContext(CursorsContext);
}
