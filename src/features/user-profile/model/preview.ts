import type { ApiFile } from '@/shared/types/user';

/**
 * Lightweight projection of a public user for hover previews (`UserLink`).
 * Built from a single `GET /users/{id}` call — deliberately NOT the full
 * `PublicUserProfile`, which fans out to socials / experiences / products
 * and is far too heavy for a peek surface.
 */
export type UserPreview = {
  id: string;
  fullName: string;
  /** Privacy-masked address (`a*****a@example.com`); display only. */
  email: string | null;
  /**
   * User-provided public contact address (unmasked — they chose to publish
   * it). Preferred over the masked `email` wherever both are shown.
   */
  publicEmail: string | null;
  avatar: ApiFile | null;
  /** Profile cover image; rendered as the hover-card banner when present. */
  cover: ApiFile | null;
  isVerified: boolean;
  /** Plain-text teaser derived from the sanitized HTML bio. */
  description: string | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
};
