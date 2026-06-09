/**
 * Backend stores product descriptions as sanitized HTML, but legacy or
 * other-client data may arrive as raw plain text. These helpers tell the two
 * apart so we can render HTML safely or fall back to text without breaking the
 * card layout (or worse, swallowing surrounding markup when a plain `<` slips
 * through).
 */

export function hasDescriptionContent(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.replace(/<[^>]+>/g, '').trim().length > 0;
}

export function looksLikeHtml(value: string): boolean {
  return /<\w+[^>]*>/.test(value);
}

/**
 * Plain-text excerpt of the description for the hero lead: tags stripped,
 * the few entities our sanitizer emits decoded, whitespace collapsed. The
 * consumer clamps visually (`line-clamp-*`), so no length cut here.
 */
export function descriptionExcerpt(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
