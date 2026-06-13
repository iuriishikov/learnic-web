import type { ApiFile } from '@/shared/types/user';

/**
 * Public projection of a platform administrator shown on marketing
 * surfaces (e.g. the landing-page support block). Field names follow
 * the `AvatarUser` contract of `UserAvatar`, so the object can be
 * passed to it directly.
 */
export type AdminUser = {
  id: string;
  fullName: string;
  isVerified: boolean;
  avatar: ApiFile | null;
};
