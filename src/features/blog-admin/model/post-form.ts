import { z } from 'zod';

import {
  BLOG_POST_SLUG_MAX_LEN,
  BLOG_POST_SLUG_MIN_LEN,
  BLOG_POST_SLUG_PATTERN,
  BLOG_POST_TITLE_MAX_LEN,
} from './limits';

/**
 * Shared validation for post identity fields (create + rename/slug edits).
 * Error values are i18n keys resolved by the form against the
 * `blog-admin` namespace.
 */
export const postFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'errors.titleRequired')
    .max(BLOG_POST_TITLE_MAX_LEN, 'errors.titleMax'),
  slug: z
    .string()
    .trim()
    .min(BLOG_POST_SLUG_MIN_LEN, 'errors.slugMin')
    .max(BLOG_POST_SLUG_MAX_LEN, 'errors.slugMax')
    .regex(BLOG_POST_SLUG_PATTERN, 'errors.slugFormat'),
});

export type PostFormInput = z.infer<typeof postFormSchema>;

// Cyrillic → Latin so a Russian title still yields a usable a-z0-9 slug
// (the backend slug pattern is ASCII-only). Covers RU + common ё/ъ/ь.
const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

function transliterate(input: string): string {
  let out = '';
  for (const ch of input) {
    out += CYRILLIC_MAP[ch] ?? ch;
  }
  return out;
}

/**
 * Derive a slug suggestion from a title: transliterate Cyrillic, lowercase,
 * collapse any remaining non-`a-z0-9` runs to single hyphens, trim hyphens.
 * Returns `''` only for titles with no transliterable characters at all
 * (the user then types the slug by hand).
 */
export function slugifyTitle(title: string): string {
  return transliterate(title.toLowerCase().trim())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, BLOG_POST_SLUG_MAX_LEN);
}
