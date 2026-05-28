/**
 * Notification primitives + envelope.
 *
 * Per-kind shapes (`*Raw`, `*Details`, descriptors) live in
 * `kinds/<kind>.tsx` and are aggregated by `kinds/registry.ts`.
 * The kind-specific unions ({@link NotificationKind},
 * {@link NotificationDetails}) are derived from the registry and
 * re-exported here so external code keeps importing from one
 * stable place.
 */

import type {
  NotificationDetails,
  NotificationDetailsRaw,
  NotificationKind,
} from '../kinds/registry';

export type { NotificationDetails, NotificationDetailsRaw, NotificationKind };

export type NotificationCategory =
  | 'teaching'
  | 'learning'
  | 'security'
  | 'files'
  | 'jobs'
  | 'other';

export type ActorRef = {
  oid: string;
  /** Display name in the canonical `Last First Patronymic` order. */
  fullName: string;
};

export type ProductRef = {
  oid: string;
  name: string;
};

export type CollaborationStatus =
  | 'pending_invite'
  | 'active'
  | 'declined'
  | 'revoked';

/**
 * Lifecycle of a `product_gift` row. Mirrors the backend `GiftStatus`
 * enum (`docs/api/openapi.json`) exhaustively — every variant must be
 * present so missing ones don't slip past `tsc` and break through
 * `default:` branches. Note: a gift uses `pending_invite` as its
 * "awaiting acceptance" state (same wording as a collaboration), but
 * unlike a collaboration its accepted terminal is `accepted`, not
 * `active`.
 */
export type GiftStatus =
  | 'pending_invite'
  | 'accepted'
  | 'declined'
  | 'revoked';

/**
 * Live snapshot of the `product_collaboration` row referenced by an
 * invite-shaped notification. Hydrated server-side via a JOIN at
 * read time — used as the single source of truth for the
 * Accept / Decline / Revoke UI state, so a reload picks up the
 * latest values without local React state having to remember
 * outcomes.
 *
 * `null` only when the collaboration row could not be hydrated; in
 * that case treat it as `unavailable` on the client.
 */
export type CollaborationSnapshot = {
  status: CollaborationStatus;
  acceptedAt: string | null;
  declinedAt: string | null;
  revokedAt: string | null;
  inviteExpiresAt: string | null;
};

/**
 * Live snapshot of the `product_gift` row referenced by a gift-shaped
 * notification. Same role as {@link CollaborationSnapshot}: hydrated
 * server-side so the Accept / Decline UI state survives a reload
 * without local React state remembering the outcome.
 *
 * `null` only when the gift row could not be hydrated; treat it as
 * `unavailable` on the client.
 */
export type GiftSnapshot = {
  status: GiftStatus;
  acceptedAt: string | null;
  declinedAt: string | null;
  revokedAt: string | null;
  inviteExpiresAt: string | null;
};

export type Notification = {
  oid: string;
  kind: NotificationKind;
  category: NotificationCategory;
  actor: ActorRef | null;
  createdAt: string;
  readAt: string | null;
  details: NotificationDetails;
};

export type NotificationPage = {
  items: Notification[];
  nextCursor: string | null;
};

export type CategoryCount = {
  category: NotificationCategory;
  total: number;
  unread: number;
};

export type NotificationCounters = {
  total: number;
  unread: number;
  byCategory: CategoryCount[];
};

export type NotificationsError =
  | { kind: 'invalidToken' }
  | { kind: 'forbidden' }
  | { kind: 'notFound' }
  | { kind: 'network' }
  | { kind: 'unknown'; message?: string };

export type ListResult =
  | { ok: true; page: NotificationPage }
  | { ok: false; error: NotificationsError };

export type CountersResult =
  | { ok: true; counters: NotificationCounters }
  | { ok: false; error: NotificationsError };

export type MarkReadResult =
  | { ok: true }
  | { ok: false; error: NotificationsError };
