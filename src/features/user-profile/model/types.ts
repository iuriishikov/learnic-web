import type { Product } from '@/features/products';
import type { SocialLink } from '@/features/user-contacts';
import type { UserExperience } from '@/features/user-experiences';
import type { ApiFile } from '@/shared/types/user';

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
  /**
   * First page of the user's PUBLISHED products, fetched on the server
   * (`GET /users/{id}/products`). Seeds the profile's load-more list; later
   * pages are fetched on the client. Empty when the user has shipped none.
   */
  products: Product[];
};
