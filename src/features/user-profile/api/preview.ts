import 'server-only';

import { toApiFile } from '@/shared/types/user';

import type { UserPreview } from '../model/preview';

import { fetchUser } from './_shared';

export type GetUserPreviewResult =
  | { ok: true; preview: UserPreview }
  | { ok: false; reason: 'not-found' | 'network' | 'unknown' };

/** `String.fromCodePoint` that swallows out-of-range refs instead of throwing. */
function decodeCodePoint(code: number, fallback: string): string {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff
    ? String.fromCodePoint(code)
    : fallback;
}

/**
 * Collapse the sanitized HTML bio into a plain-text teaser. The hover card
 * line-clamps the result, so markup structure (paragraphs, lists) would only
 * waste the three lines it has. Numeric refs are decoded alongside the named
 * basics, and `&amp;` is decoded LAST so doubly-escaped text (`&amp;lt;`)
 * resolves to its displayed form (`&lt;`) instead of double-decoding to `<`.
 */
function toPlainText(html: string | null): string | null {
  if (html === null) return null;
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (ref, hex: string) =>
      decodeCodePoint(parseInt(hex, 16), ref),
    )
    .replace(/&#(\d+);/g, (ref, dec: string) =>
      decodeCodePoint(Number(dec), ref),
    )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 0 ? text : null;
}

/**
 * Hover-preview slice of a public user — a single `GET /users/{id}` call.
 * Use `getPublicUserProfile` for the full profile page; this one exists so
 * peek surfaces (`UserLink`) don't pay for socials / experiences / products.
 */
export async function getUserPreview(
  id: string,
): Promise<GetUserPreviewResult> {
  const result = await fetchUser(id);
  if (!result.ok) return result;

  const user = result.user;
  return {
    ok: true,
    preview: {
      id: user.oid,
      fullName: user.full_name,
      email: user.email ?? null,
      publicEmail: user.public_email ?? null,
      avatar: user.avatar !== null ? toApiFile(user.avatar) : null,
      cover: user.cover !== null ? toApiFile(user.cover) : null,
      isVerified: user.is_verified ?? false,
      description: toPlainText(user.description),
      websiteUrl: user.website_url ?? null,
      portfolioUrl: user.portfolio_url ?? null,
    },
  };
}
