/**
 * Turn a chunk of (server-sanitized) HTML into a plain-text excerpt for
 * cards and previews: strip tags, decode the handful of entities that
 * actually show up in body copy, collapse whitespace, and truncate on a
 * word boundary with an ellipsis.
 *
 * Pure and SSR-safe (no DOMParser) so it can run in a query function on
 * either side of the hydration boundary.
 */

const TAG_RE = /<[^>]*>/g;
const WHITESPACE_RE = /\s+/g;

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

const ENTITY_RE = /&(?:amp|lt|gt|quot|#39|apos|nbsp|mdash|ndash|hellip);/g;

export function htmlToExcerpt(html: string, maxLength = 160): string {
  const text = html
    .replace(TAG_RE, ' ')
    .replace(ENTITY_RE, (match) => ENTITIES[match] ?? match)
    .replace(WHITESPACE_RE, ' ')
    .trim();

  if (text.length <= maxLength) return text;

  const clipped = text.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  const head = lastSpace > maxLength * 0.6 ? clipped.slice(0, lastSpace) : clipped;
  return `${head.trimEnd()}…`;
}
