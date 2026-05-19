/**
 * The application's User concept. Lives in `shared/types` because the
 * auth context is cross-cutting infrastructure consumed by features
 * other than `auth` (presence, products, web-push, user-contacts,
 * user-experiences, …); pinning the type to `features/auth` would
 * force those features to depend on auth and violate the
 * features-never-import-features rule.
 *
 * Auth-feature-specific bits (the wire-shape `UserResponse`, the
 * `toUser` mapper, `parseFullName`) stay in `features/auth/model/user`
 * — they ARE auth-specific because only the `/auth/me` endpoint
 * produces them.
 */
/**
 * Resolved file reference returned by every API response that embeds
 * a stored file (avatars, covers, user-experience icons, lesson-block
 * uploads). The `url` is a short-lived presigned-storage URL the SPA
 * plugs straight into `<img>` / `<video>` / download links; refetch
 * the parent resource to refresh it.
 */
export type ApiFile = {
  oid: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};

/** Backend wire-shape (snake_case) mirroring `FileSchema` in `openapi.json`. */
export type FileResponse = {
  oid: string;
  content_type: string;
  size_bytes: number;
  url: string;
};

export function toApiFile(raw: FileResponse): ApiFile {
  return {
    oid: raw.oid,
    contentType: raw.content_type,
    sizeBytes: raw.size_bytes,
    url: raw.url,
  };
}

export type User = {
  oid: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  /** Display name in the canonical `Last First Patronymic` order, returned by the backend. */
  fullName: string;
  /** Privacy-masked email in the form `f*****d@domain.com`. */
  email: string;
  /**
   * Whether the platform granted this user the public "verified" badge.
   * Surfaced as a brand-coloured checkmark on the avatar.
   */
  isVerified: boolean;
  description: string | null;
  avatar: ApiFile | null;
  cover: ApiFile | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
  /** Display-only contact email distinct from `email` (login). */
  publicEmail: string | null;
};
