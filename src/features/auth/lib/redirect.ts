export const FROM_PARAM = 'from';

export function sanitizeRedirectTarget(
  value: string | null | undefined,
): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  if (value.includes('\\')) return null;
  return value;
}

export function appendFrom(
  href: string,
  from: string | null | undefined,
): string {
  const safe = sanitizeRedirectTarget(from);
  if (!safe) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}${FROM_PARAM}=${encodeURIComponent(safe)}`;
}
