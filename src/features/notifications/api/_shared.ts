import 'server-only';

import {
  parseDetails,
  type NotificationDetailsRaw,
} from '../kinds/registry';
import { toActor, type ActorRaw } from '../kinds/shared';
import type {
  Notification,
  NotificationCategory,
  NotificationCounters,
  NotificationPage,
} from '../model/types';

export type NotificationRaw = {
  oid: string;
  kind: Notification['kind'];
  category: NotificationCategory;
  actor: ActorRaw | null;
  created_at: string;
  read_at: string | null;
  details: NotificationDetailsRaw;
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

export function toNotification(raw: NotificationRaw): Notification {
  return {
    oid: raw.oid,
    kind: raw.kind,
    category: raw.category,
    actor: raw.actor ? toActor(raw.actor) : null,
    createdAt: raw.created_at,
    readAt: raw.read_at,
    details: parseDetails(raw.details),
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
