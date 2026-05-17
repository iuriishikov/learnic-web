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
  avatarUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
  /** Display-only contact email distinct from `email` (login). */
  publicEmail: string | null;
};
