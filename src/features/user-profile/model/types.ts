import type { ProductShowcaseAccent, ProductShowcaseType } from '@/features/products';
import type { SocialLink } from '@/features/user-contacts';
import type { UserExperience } from '@/features/user-experiences';

export type PublicProfileProduct = {
  id: string;
  type: ProductShowcaseType;
  title: string;
  /** Pre-formatted duration label (e.g. "2.2 ч"). */
  durationLabel: string;
  /** Pre-formatted due-date label, or `null` for evergreen products. */
  dueLabel: string | null;
  accent: ProductShowcaseAccent;
  coverUrl: string | null;
};

export type PublicUserProfile = {
  id: string;
  fullName: string;
  /** Privacy-masked email (`f*****d@domain.com`) returned by the backend. */
  email: string;
  avatarUrl: string | null;
  coverUrl: string | null;
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
