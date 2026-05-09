'use client';

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  Notification,
  NotificationCategory,
  NotificationCounters,
  NotificationPage,
  NotificationsError,
} from '../model/types';

import {
  getNotificationCountersAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from './notifications';

export const notificationsListKey = (
  category: NotificationCategory | null,
) => ['notifications', 'list', category ?? 'all'] as const;

export const notificationsCountersKey = () =>
  ['notifications', 'counters'] as const;

const PAGE_SIZE = 20;

export function useNotificationsListQuery(
  category: NotificationCategory | null,
  enabled: boolean,
) {
  return useInfiniteQuery<
    NotificationPage,
    NotificationsError,
    { pages: NotificationPage[]; pageParams: (string | null)[] },
    ReturnType<typeof notificationsListKey>,
    string | null
  >({
    queryKey: notificationsListKey(category),
    enabled,
    initialPageParam: null,
    getNextPageParam: (last) => last.nextCursor,
    queryFn: async ({ pageParam }) => {
      const result = await listNotificationsAction({
        category: category ?? undefined,
        cursor: pageParam ?? undefined,
        limit: PAGE_SIZE,
      });
      if (!result.ok) throw result.error;
      return result.page;
    },
    staleTime: 30_000,
  });
}

export function useNotificationCountersQuery(enabled: boolean) {
  return useQuery<NotificationCounters, NotificationsError>({
    queryKey: notificationsCountersKey(),
    enabled,
    queryFn: async () => {
      const result = await getNotificationCountersAction();
      if (!result.ok) throw result.error;
      return result.counters;
    },
    staleTime: 30_000,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation<void, NotificationsError, string>({
    mutationFn: async (id) => {
      const result = await markNotificationReadAction(id);
      if (!result.ok) throw result.error;
    },
    onSuccess: (_data, notificationId) => {
      patchListsForRead(qc, notificationId);
      qc.invalidateQueries({ queryKey: notificationsCountersKey() });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation<void, NotificationsError, void>({
    mutationFn: async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) throw result.error;
    },
    onSuccess: () => {
      patchAllListsForReadAll(qc);
      qc.invalidateQueries({ queryKey: notificationsCountersKey() });
    },
  });
}

type ListData = {
  pages: NotificationPage[];
  pageParams: (string | null)[];
};

function patchListsForRead(
  qc: ReturnType<typeof useQueryClient>,
  notificationId: string,
): void {
  const now = new Date().toISOString();
  qc.setQueriesData<ListData>(
    { queryKey: ['notifications', 'list'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((n) =>
            n.oid === notificationId && n.readAt === null
              ? ({ ...n, readAt: now } as Notification)
              : n,
          ),
        })),
      };
    },
  );
}

function patchAllListsForReadAll(qc: ReturnType<typeof useQueryClient>): void {
  const now = new Date().toISOString();
  qc.setQueriesData<ListData>(
    { queryKey: ['notifications', 'list'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((n) =>
            n.readAt === null ? ({ ...n, readAt: now } as Notification) : n,
          ),
        })),
      };
    },
  );
}
