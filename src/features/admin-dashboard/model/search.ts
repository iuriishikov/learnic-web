/**
 * Types for the admin quick-action search palettes (users / notes).
 * camelCase domain shapes the menus consume — the snake_case wire
 * payloads are mapped to them at the `api/` boundary.
 */

import type { ApiFile } from '@/shared/types/user';

/** Minimum query length before a search request fires (backend rejects 1 char). */
export const SEARCH_MIN_QUERY_LEN = 2;

/**
 * One row of the user-search palette. Shaped to satisfy the shared
 * `AvatarUser` projection so it can be handed straight to `UserAvatar`.
 */
export type AdminUserResult = {
  id: string;
  fullName: string;
  avatar: ApiFile | null;
  isVerified: boolean;
  /** Whether the user is currently banned — drives ban vs. unban action. */
  isBanned: boolean;
};

/** One row of the note-search palette. */
export type AdminNoteResult = {
  id: string;
  title: string;
  authorName: string;
};
