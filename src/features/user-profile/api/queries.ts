import 'server-only';

import {
  getUserProductsAction,
  USER_PRODUCTS_PAGE_SIZE,
  type Product,
} from '@/features/products';
import {
  listSocialLinksAction,
  type SocialLink,
} from '@/features/user-contacts';
import {
  listUserExperiencesAction,
  type UserExperience,
} from '@/features/user-experiences';
import { toApiFile } from '@/shared/types/user';

import type { PublicUserProfile } from '../model/types';

import { fetchUser } from './_shared';

async function fetchSocials(id: string): Promise<SocialLink[]> {
  // Secondary data — degrade silently to an empty list rather than
  // throwing, so a transient socials outage doesn't take the page down.
  try {
    const result = await listSocialLinksAction(id);
    return result.ok ? result.entries : [];
  } catch {
    return [];
  }
}

async function fetchExperiences(id: string): Promise<UserExperience[]> {
  try {
    const result = await listUserExperiencesAction(id);
    return result.ok ? result.entries : [];
  } catch {
    return [];
  }
}

async function fetchUserProducts(id: string): Promise<Product[]> {
  // First page of the user's PUBLISHED products via the dedicated
  // per-author endpoint (`GET /users/{id}/products`). Seeds the
  // profile's load-more list. Secondary content — degrade silently to
  // an empty list rather than throwing, so a transient products outage
  // doesn't take the whole profile down.
  try {
    const result = await getUserProductsAction({
      userId: id,
      offset: 0,
      limit: USER_PRODUCTS_PAGE_SIZE,
    });
    return result.ok ? result.products : [];
  } catch {
    return [];
  }
}

export type GetPublicUserProfileResult =
  | { ok: true; profile: PublicUserProfile }
  | { ok: false; reason: 'not-found' | 'network' | 'unknown' };

export async function getPublicUserProfile(
  id: string,
): Promise<GetPublicUserProfileResult> {
  const result = await fetchUser(id);
  if (!result.ok) return result;

  const user = result.user;
  const [socials, experiences, products] = await Promise.all([
    fetchSocials(user.oid),
    fetchExperiences(user.oid),
    fetchUserProducts(user.oid),
  ]);

  return {
    ok: true,
    profile: {
      id: user.oid,
      fullName: user.full_name,
      email: user.email,
      avatar: user.avatar !== null ? toApiFile(user.avatar) : null,
      cover: user.cover !== null ? toApiFile(user.cover) : null,
      isVerified: user.is_verified ?? false,
      descriptionHtml: user.description,
      websiteUrl: user.website_url ?? null,
      portfolioUrl: user.portfolio_url ?? null,
      publicEmail: user.public_email ?? null,
      socials,
      experiences,
      products,
    },
  };
}
