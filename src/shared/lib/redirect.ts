/**
 * Generic next-URL helpers — used by auth flows (login/register/email-
 * verify) to carry a post-login destination through the `?from=` query
 * param, but the helpers themselves are domain-neutral, so they live
 * in `shared/lib` rather than under any feature. Anything that needs
 * to forward an internal redirect target (post-checkout return,
 * post-onboarding next step, etc.) can reuse them without crossing a
 * feature boundary.
 *
 * Same-origin guard: only paths that start with a single `/` are
 * allowed through. Schemes, `//host`-relative URLs, and Windows-style
 * backslashes are rejected so attackers cannot piggy-back on a
 * `from=` param to bounce the user off the platform.
 */
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
