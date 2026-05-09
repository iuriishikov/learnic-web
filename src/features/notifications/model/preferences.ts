import { z } from 'zod';

import type { NotificationCategory } from './types';

/**
 * Frontend-side mirror of the backend `NotificationPreferencesSchema`.
 *
 * Each channel carries one bool per category; in-app delivery is
 * not part of the wire format because it cannot be disabled —
 * the settings UI renders the in-app toggles as locked-on.
 */

export type NotificationChannel = 'push' | 'email' | 'inApp';

export type CategoryToggles = Record<NotificationCategory, boolean>;

export type NotificationPreferences = {
  push: CategoryToggles;
  email: CategoryToggles;
};

export const categoryTogglesSchema = z.object({
  invites: z.boolean(),
  files: z.boolean(),
  jobs: z.boolean(),
  other: z.boolean(),
});

export const notificationPreferencesSchema = z.object({
  push: categoryTogglesSchema,
  email: categoryTogglesSchema,
});

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;

export const ALL_CATEGORIES: readonly NotificationCategory[] = [
  'invites',
  'files',
  'jobs',
  'other',
] as const;

/**
 * Categories actually wired to a notification kind today.
 *
 * The schema (and backend storage) keeps a column per ``ALL_CATEGORIES``
 * value so newly-added kinds slot in without a migration; the settings
 * page renders only the entries here so the UI never shows a toggle
 * that has no business meaning yet. Add a category here the moment a
 * ``NotificationKind`` is introduced that maps to it.
 */
export const ACTIVE_CATEGORIES: readonly NotificationCategory[] = [
  'invites',
] as const;

export const CHANNELS_WITH_TOGGLE: readonly NotificationChannel[] = [
  'push',
  'email',
  'inApp',
] as const;

export type PreferencesError =
  | { kind: 'invalidToken' }
  | { kind: 'forbidden' }
  | { kind: 'notFound' }
  | { kind: 'network' }
  | { kind: 'validation' }
  | { kind: 'unknown'; message?: string };

export type GetPreferencesResult =
  | { ok: true; preferences: NotificationPreferences }
  | { ok: false; error: PreferencesError };

export type UpdatePreferencesResult =
  | { ok: true; preferences: NotificationPreferences }
  | { ok: false; error: PreferencesError };
