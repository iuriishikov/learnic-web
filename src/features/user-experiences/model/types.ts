import type { ApiFile } from '@/shared/types/user';

/**
 * Public profile entry mirroring the backend `UserExperienceSchema`
 * returned by `GET /users/{user_id}/experiences`.
 *
 * Dates arrive as ISO 8601 calendar strings (`YYYY-MM-DD`, no time).
 * `endDate === null` encodes ongoing entries — the card renders them
 * as "<start> – Present".
 */
export type UserExperience = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  /** ISO 8601 calendar date (`YYYY-MM-DD`). */
  startDate: string;
  /** ISO 8601 calendar date or `null` for ongoing entries. */
  endDate: string | null;
  sourceUrl: string | null;
  /**
   * Resolved icon file with a short-lived presigned URL, or `null`
   * when no icon is attached. Refetch the list to refresh.
   */
  icon: ApiFile | null;
};
