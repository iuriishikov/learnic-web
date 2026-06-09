import 'server-only';

import type {
  ProductShowcaseAccent,
  ProductShowcaseType,
} from '@/features/products';
import { softAccentFromSeed } from '@/shared/lib/placeholder-accent';
import {
  listSocialLinksAction,
  type SocialLink,
} from '@/features/user-contacts';
import {
  listUserExperiencesAction,
  type UserExperience,
} from '@/features/user-experiences';
import { apiFetch } from '@/shared/api/client';
import { toApiFile, type FileResponse } from '@/shared/types/user';

import type { PublicProfileProduct, PublicUserProfile } from '../model/types';

import { fetchUser } from './_shared';

type ProductSchemaResponse = {
  oid: string;
  type: ProductShowcaseType;
  status: 'draft' | 'published' | 'archived' | 'banned';
  name: string;
  description: string | null;
  total_duration_in_hours: number | null;
  author: { oid: string; full_name: string; email: string };
  cover: FileResponse | null;
  /** Not in the spec's `required` list — guard against absence. */
  tags?: { oid: string; name: string; color: string }[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function durationLabel(hours: number | null): string | null {
  // Unset / non-positive → null so the card hides the stat entirely
  // rather than rendering a "—" placeholder.
  if (hours == null || hours <= 0) return null;
  // Russian short hour suffix; matches the rest of the catalog UI.
  return `${hours} ч`;
}

function toProduct(raw: ProductSchemaResponse): PublicProfileProduct {
  return {
    id: raw.oid,
    type: raw.type,
    title: raw.name,
    description: raw.description,
    durationLabel: durationLabel(raw.total_duration_in_hours),
    dueLabel: null,
    accent: softAccentFromSeed(raw.oid) as ProductShowcaseAccent,
    cover: raw.cover !== null ? toApiFile(raw.cover) : null,
    tags: (raw.tags ?? []).map((tag) => ({
      id: tag.oid,
      name: tag.name,
      color: tag.color,
    })),
  };
}

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

async function fetchUserProducts(id: string): Promise<PublicProfileProduct[]> {
  // Backend has no per-author endpoint yet — pull the public catalog
  // and filter locally. Limit caps at 100 so this is bounded; revisit
  // once `/users/{user_id}/products` lands.
  let res: Response;
  try {
    res = await apiFetch('/products?limit=100', { method: 'GET' });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const raw = (await res.json()) as ProductSchemaResponse[];
  return raw
    .filter((p) => p.author.oid === id && p.status === 'published')
    .map(toProduct);
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
