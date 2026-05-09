'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotificationPreferencesAction,
  updateNotificationPreferencesAction,
} from './preferences';
import type {
  NotificationPreferences,
  NotificationPreferencesInput,
  PreferencesError,
} from '../model/preferences';

export const notificationPreferencesKey = () =>
  ['notifications', 'preferences'] as const;

export function useNotificationPreferencesQuery(enabled: boolean = true) {
  return useQuery<NotificationPreferences, PreferencesError>({
    queryKey: notificationPreferencesKey(),
    enabled,
    queryFn: async () => {
      const result = await getNotificationPreferencesAction();
      if (!result.ok) throw result.error;
      return result.preferences;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const qc = useQueryClient();
  return useMutation<
    NotificationPreferences,
    PreferencesError,
    NotificationPreferencesInput
  >({
    mutationFn: async (input) => {
      const result = await updateNotificationPreferencesAction(input);
      if (!result.ok) throw result.error;
      return result.preferences;
    },
    onSuccess: (data) => {
      qc.setQueryData(notificationPreferencesKey(), data);
    },
  });
}
