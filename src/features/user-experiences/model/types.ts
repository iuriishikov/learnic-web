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
   * Short-lived presigned URL for the icon, or `null` when no icon
   * is attached. Refetch the list to refresh — URLs expire.
   */
  iconUrl: string | null;
};
