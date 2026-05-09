/**
 * Frontend types mirroring the backend `NotificationView`.
 *
 * The backend serializes camelCase fields with `snake_case` only on
 * a handful of legacy keys (none for notifications). The mapping
 * happens at the apiFetch boundary in this feature's `api/` layer —
 * never let `snake_case` leak past it.
 */

export type NotificationCategory = 'invites' | 'files' | 'jobs' | 'other';

export type NotificationKind = 'invite_sent' | 'invite_accepted';

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
 * Live snapshot of the `product_collaboration` row referenced by an
 * invite notification. Hydrated server-side via a JOIN at read time
 * — the SPA uses this as the single source of truth for the
 * Accept / Decline UI state, so a reload picks up the latest values
 * without local React state having to remember outcomes.
 *
 * `null` only when the collaboration row could not be hydrated; in
 * that case treat the invite as `unavailable`.
 */
export type CollaborationSnapshot = {
  status: CollaborationStatus;
  acceptedAt: string | null;
  declinedAt: string | null;
  revokedAt: string | null;
  inviteExpiresAt: string | null;
};

export type InviteSentDetails = {
  type: 'invite_sent';
  collaborationId: string;
  product: ProductRef;
  collaboration: CollaborationSnapshot | null;
};

export type InviteAcceptedDetails = {
  type: 'invite_accepted';
  collaborationId: string;
  product: ProductRef;
  collaborator: ActorRef;
  collaboration: CollaborationSnapshot | null;
};

export type NotificationDetails = InviteSentDetails | InviteAcceptedDetails;

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
