import 'server-only';

import type {
  ActorRef,
  CollaborationSnapshot,
  CollaborationStatus,
  Notification,
  NotificationCategory,
  NotificationCounters,
  NotificationDetails,
  NotificationPage,
  ProductRef,
} from '../model/types';

type ActorRaw = {
  oid: string;
  full_name: string;
};

type ProductRaw = { oid: string; name: string };

type CollaborationRaw = {
  status: CollaborationStatus;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  invite_expires_at: string | null;
};

type DetailsRaw =
  | {
      type: 'invite_sent';
      collaboration_id: string;
      product: ProductRaw;
      collaboration: CollaborationRaw | null;
    }
  | {
      type: 'invite_accepted';
      collaboration_id: string;
      product: ProductRaw;
      collaborator: ActorRaw;
      collaboration: CollaborationRaw | null;
    };

export type NotificationRaw = {
  oid: string;
  kind: Notification['kind'];
  category: NotificationCategory;
  actor: ActorRaw | null;
  created_at: string;
  read_at: string | null;
  details: DetailsRaw;
};

export type NotificationPageRaw = {
  items: NotificationRaw[];
  next_cursor: string | null;
};

type CategoryCountRaw = {
  category: NotificationCategory;
  total: number;
  unread: number;
};

export type CountersRaw = {
  total: number;
  unread: number;
  by_category: CategoryCountRaw[];
};

function toActor(raw: ActorRaw): ActorRef {
  return {
    oid: raw.oid,
    fullName: raw.full_name,
  };
}

function toProduct(raw: ProductRaw): ProductRef {
  return { oid: raw.oid, name: raw.name };
}

function toCollaboration(
  raw: CollaborationRaw | null | undefined,
): CollaborationSnapshot | null {
  if (raw == null) return null;
  return {
    status: raw.status,
    acceptedAt: raw.accepted_at,
    declinedAt: raw.declined_at,
    revokedAt: raw.revoked_at,
    inviteExpiresAt: raw.invite_expires_at,
  };
}

function toDetails(raw: DetailsRaw): NotificationDetails {
  if (raw.type === 'invite_sent') {
    return {
      type: 'invite_sent',
      collaborationId: raw.collaboration_id,
      product: toProduct(raw.product),
      collaboration: toCollaboration(raw.collaboration),
    };
  }
  return {
    type: 'invite_accepted',
    collaborationId: raw.collaboration_id,
    product: toProduct(raw.product),
    collaborator: toActor(raw.collaborator),
    collaboration: toCollaboration(raw.collaboration),
  };
}

export function toNotification(raw: NotificationRaw): Notification {
  return {
    oid: raw.oid,
    kind: raw.kind,
    category: raw.category,
    actor: raw.actor ? toActor(raw.actor) : null,
    createdAt: raw.created_at,
    readAt: raw.read_at,
    details: toDetails(raw.details),
  };
}

export function toPage(raw: NotificationPageRaw): NotificationPage {
  return {
    items: raw.items.map(toNotification),
    nextCursor: raw.next_cursor,
  };
}

export function toCounters(raw: CountersRaw): NotificationCounters {
  return {
    total: raw.total,
    unread: raw.unread,
    byCategory: raw.by_category.map((b) => ({
      category: b.category,
      total: b.total,
      unread: b.unread,
    })),
  };
}
