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
