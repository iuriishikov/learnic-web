/**
 * Wire + domain types for the live storage-quota WebSocket channel
 * (`WS /users/me/storage`).
 *
 * Every message the backend pushes is a FULL snapshot of the caller's
 * storage state — never a delta. The `kind` only distinguishes the
 * initial post-connect snapshot from a later usage change; both carry
 * the same payload shape. Field-name convention: snake_case on the
 * wire, camelCase in the domain — the mapping happens at the hook's
 * parse boundary in `api/use-storage-quota-ws.ts`.
 */

/** Discriminator on the raw envelope. Both kinds carry a full snapshot. */
export type StorageQuotaKind = 'snapshot' | 'usage_changed';

export type StorageQuota = {
  planCode: string;
  maxBytes: number;
  usedBytes: number;
  remainingBytes: number;
  /** ISO 8601 — used to drop out-of-order envelopes. */
  occurredAt: string;
};

/* ---------- wire shape (server push) ---------- */

export type StorageQuotaEnvelope = {
  kind: StorageQuotaKind;
  plan_code: string;
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
export function isStorageQuotaEnvelope(
  value: unknown,
): value is StorageQuotaEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.kind === 'snapshot' || v.kind === 'usage_changed') &&
    typeof v.plan_code === 'string' &&
    typeof v.storage_bytes_max === 'number' &&
    typeof v.storage_bytes_used === 'number' &&
    typeof v.storage_bytes_remaining === 'number' &&
    typeof v.occurred_at === 'string'
  );
}

export function fromStorageQuotaEnvelope(
  raw: StorageQuotaEnvelope,
): StorageQuota {
  return {
    planCode: raw.plan_code,
    maxBytes: raw.storage_bytes_max,
    usedBytes: raw.storage_bytes_used,
    remainingBytes: raw.storage_bytes_remaining,
    occurredAt: raw.occurred_at,
  };
}
