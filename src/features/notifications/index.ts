export { NotificationsBell } from './components/notifications-bell';

export {
  listNotificationsAction,
  getNotificationCountersAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from './api/notifications';

export {
  useNotificationsListQuery,
  useNotificationCountersQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './api/queries';

export {
  getNotificationPreferencesAction,
  updateNotificationPreferencesAction,
} from './api/preferences';

export {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  notificationPreferencesKey,
} from './api/preferences-queries';

export {
  ACTIVE_CATEGORIES,
  ALL_CATEGORIES,
  CHANNELS_WITH_TOGGLE,
  notificationPreferencesSchema,
  categoryTogglesSchema,
} from './model/preferences';

export type {
  Notification,
  NotificationCategory,
  NotificationCounters,
  NotificationKind,
  NotificationPage,
  NotificationsError,
} from './model/types';

export type {
  CategoryToggles,
  NotificationChannel,
  NotificationPreferences,
  NotificationPreferencesInput,
  PreferencesError,
} from './model/preferences';
