/**
 * Wire + domain types for the caller's current subscription.
 *
 * Mirrors the backend's `MySubscriptionSchema` (see
 * `learnic/src/learnic/presentation/http/routes/subscription.py`).
 * Field-name convention: snake_case on the wire, camelCase in the
 * domain. The mapping happens at the `apiFetch` boundary in
 * `api/get-my-subscription.ts`.
 */

export type PlanLimits = {
  storageBytesMax: number;
};

export type PlanInfo = {
  /** Stable token, e.g. `FREE`, `BETA`. */
  code: string;
  /** Human-readable plan name. */
  name: string;
  limits: PlanLimits;
};

export type StorageUsage = {
  storageBytes: number;
};

export type MySubscription = {
  plan: PlanInfo;
  used: StorageUsage;
  expiresAt: string | null;
};

/* ---------- wire shapes (server response) ---------- */

export type PlanLimitsResponse = {
  storage_bytes_max: number;
};

export type PlanInfoResponse = {
  code: string;
  name: string;
  limits: PlanLimitsResponse;
};

export type StorageUsageResponse = {
  storage_bytes: number;
};

export type MySubscriptionResponse = {
  plan: PlanInfoResponse;
  used: StorageUsageResponse;
  expires_at: string | null;
};

export function fromMySubscriptionResponse(
  raw: MySubscriptionResponse,
): MySubscription {
  return {
    plan: {
      code: raw.plan.code,
      name: raw.plan.name,
      limits: { storageBytesMax: raw.plan.limits.storage_bytes_max },
    },
    used: { storageBytes: raw.used.storage_bytes },
    expiresAt: raw.expires_at,
  };
}
