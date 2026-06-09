import type {
  ProductShowcaseAccent,
  ProductShowcaseTag,
  ProductShowcaseType,
} from '@/features/products';
import type { SocialLink } from '@/features/user-contacts';
import type { UserExperience } from '@/features/user-experiences';
import type { ApiFile } from '@/shared/types/user';

export type PublicProfileProduct = {
  id: string;
  type: ProductShowcaseType;
  title: string;
  /**
   * Description as stored by the backend (sanitized HTML or legacy plain
   * text); `ProductShowcaseCard` derives its own plain-text excerpt.
   */
  description: string | null;
  /** Pre-formatted duration label (e.g. "2.2 ч"), or `null` when unset. */
  durationLabel: string | null;
  /** Pre-formatted due-date label, or `null` for evergreen products. */
  dueLabel: string | null;
  accent: ProductShowcaseAccent;
  cover: ApiFile | null;
  /** Tags in author-defined order, embedded inline by the backend. */
  tags: ProductShowcaseTag[];
};

export type PublicUserProfile = {
  id: string;
  fullName: string;
  /** Privacy-masked email (`f*****d@domain.com`) returned by the backend. */
  email: string;
  avatar: ApiFile | null;
  cover: ApiFile | null;
  isVerified: boolean;
  /** Sanitized HTML bio; render directly via dangerouslySetInnerHTML. */
  descriptionHtml: string | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
  publicEmail: string | null;
  socials: SocialLink[];
  experiences: UserExperience[];
  products: PublicProfileProduct[];
};
