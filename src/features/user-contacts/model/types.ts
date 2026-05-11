export const SOCIAL_LINK_KINDS = [
  'linkedin',
  'twitter',
  'github',
  'telegram',
  'instagram',
  'youtube',
  'facebook',
  'tiktok',
  'vk',
  'dribbble',
  'behance',
  'other',
] as const;

export type SocialLinkKind = (typeof SOCIAL_LINK_KINDS)[number];

export type SocialLink = {
  kind: SocialLinkKind;
  url: string;
  position: number;
};

export type SocialLinkDraft = Pick<SocialLink, 'kind' | 'url'>;

const SOCIAL_HOST_PATTERNS: ReadonlyArray<readonly [RegExp, SocialLinkKind]> = [
  [/(^|\.)linkedin\.com$/i, 'linkedin'],
  [/(^|\.)(twitter\.com|x\.com)$/i, 'twitter'],
  [/(^|\.)github\.(com|io)$/i, 'github'],
  [/(^|\.)(t\.me|telegram\.me|telegram\.org)$/i, 'telegram'],
  [/(^|\.)instagram\.com$/i, 'instagram'],
  [/(^|\.)(youtube\.com|youtu\.be)$/i, 'youtube'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/i, 'facebook'],
  [/(^|\.)tiktok\.com$/i, 'tiktok'],
  [/(^|\.)(vk\.com|vk\.ru|vkontakte\.ru)$/i, 'vk'],
  [/(^|\.)dribbble\.com$/i, 'dribbble'],
  [/(^|\.)behance\.net$/i, 'behance'],
];

/**
 * Resolve which known social network a URL points at by matching its
 * hostname. Unrecognised hosts (or unparseable input) map to ``other``
 * so we can still ship the link to the backend, which requires a kind.
 */
export function detectSocialKind(url: string): SocialLinkKind {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  for (const [pattern, kind] of SOCIAL_HOST_PATTERNS) {
    if (pattern.test(host)) return kind;
  }
  return 'other';
}
