'use client';

import { useEffect, useState } from 'react';

import {
  fromNoteStorageEnvelope,
  isNoteStorageEnvelope,
  type NoteStorage,
} from '../model/note-storage';

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
// Terminal handshake/runtime closes — never retry:
//   4401 = auth failure
//   4403 = caller lacks EDIT_LESSONS on the note
//   4404 = note gone
const TERMINAL_CLOSE_CODES = new Set([4401, 4403, 4404]);

/**
 * Subscribe to the per-note live storage WebSocket channel
 * (`WS /notes/{note_id}/storage`) and expose the latest snapshot.
 *
 * Every message is a FULL snapshot, never a delta — a `snapshot`
 * arrives right after connect (and after every reconnect), so no REST
 * bootstrap is needed. Out-of-order pushes are dropped by comparing
 * `occurred_at` against the last applied envelope.
 *
 * Mount this in an ALWAYS-MOUNTED ancestor (here: the editor view's
 * persistent desktop sidebar) and pass the result down — never inside
 * popup/dropdown content, which unmounts on close and would reopen the
 * socket on every open. `enabled` gates activation for conditional
 * surfaces. Changing `noteId` resets state and reopens the socket.
 *
 * Mirrors the lifecycle/backoff conventions of the per-user storage
 * quota WS, minus its query-cache side effect — this channel feeds only
 * local state.
 */
export function useNoteStorageWs(
  noteId: string,
  enabled = true,
): NoteStorage | null {
  const [storage, setStorage] = useState<NoteStorage | null>(null);
  // Track which note the current snapshot belongs to. When `noteId`
  // changes we reset state *during render* (React's recommended pattern)
  // so the card never flashes the previous note's numbers across a switch
  // — no setState inside the effect body.
  const [storageNoteId, setStorageNoteId] = useState(noteId);
  if (storageNoteId !== noteId) {
    setStorageNoteId(noteId);
    setStorage(null);
  }

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
      // on the WS handshake — same pattern as the product-events socket.
      const url = `${wsProtocol}//${host}/api/notes/${noteId}/storage`;
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
        if (!isNoteStorageEnvelope(parsed)) return;
        applyStorage(fromNoteStorageEnvelope(parsed));
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

    function applyStorage(next: NoteStorage): void {
      // Drop envelopes that are older than the one already applied.
      if (lastAppliedAt !== null && next.occurredAt < lastAppliedAt) return;
      lastAppliedAt = next.occurredAt;
      setStorage(next);
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
  }, [noteId, enabled]);

  return storage;
}
