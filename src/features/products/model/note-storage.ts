/**
 * Wire + domain types for the per-note live storage WebSocket channel
 * (`WS /notes/{note_id}/storage`).
 *
 * Every message the backend pushes is a FULL snapshot — never a delta.
 * The `kind` only distinguishes the initial post-connect snapshot from a
 * later usage change; both carry the same payload shape. The payload
 * mirrors the per-user storage-quota channel but adds
 * `note_storage_bytes_used` — the bytes consumed by THIS note's files,
 * shown alongside the author's pool figures. Field-name convention:
 * snake_case on the wire, camelCase in the domain — the mapping happens
 * at the hook's parse boundary in `api/use-note-storage-ws.ts`.
 */

/** Discriminator on the raw envelope. Both kinds carry a full snapshot. */
export type NoteStorageKind = 'snapshot' | 'usage_changed';

export type NoteStorage = {
  planCode: string;
  /** Bytes used by THIS note's files. */
  noteUsedBytes: number;
  /** Author's pool cap. */
  maxBytes: number;
  /** Author's pool used across all notes. */
  usedBytes: number;
  /** Pool headroom, clamped >= 0 by the backend. */
  remainingBytes: number;
  /** ISO 8601 — used to drop out-of-order envelopes. */
  occurredAt: string;
};

/* ---------- wire shape (server push) ---------- */

export type NoteStorageEnvelope = {
  kind: NoteStorageKind;
  plan_code: string;
  note_storage_bytes_used: number;
  storage_bytes_max: number;
  storage_bytes_used: number;
  storage_bytes_remaining: number;
  occurred_at: string;
};

/**
 * Structural guard for an untrusted parsed message. Validates the
 * discriminator and that every numeric/string field is present and of
 * the right type before the hook trusts the envelope.
 */
export function isNoteStorageEnvelope(
  value: unknown,
): value is NoteStorageEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.kind === 'snapshot' || v.kind === 'usage_changed') &&
    typeof v.plan_code === 'string' &&
    typeof v.note_storage_bytes_used === 'number' &&
    typeof v.storage_bytes_max === 'number' &&
    typeof v.storage_bytes_used === 'number' &&
    typeof v.storage_bytes_remaining === 'number' &&
    typeof v.occurred_at === 'string'
  );
}

export function fromNoteStorageEnvelope(raw: NoteStorageEnvelope): NoteStorage {
  return {
    planCode: raw.plan_code,
    noteUsedBytes: raw.note_storage_bytes_used,
    maxBytes: raw.storage_bytes_max,
    usedBytes: raw.storage_bytes_used,
    remainingBytes: raw.storage_bytes_remaining,
    occurredAt: raw.occurred_at,
  };
}
