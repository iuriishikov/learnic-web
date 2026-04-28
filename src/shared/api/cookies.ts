import type { cookies as cookiesFn } from 'next/headers';

type CookieStore = Awaited<ReturnType<typeof cookiesFn>>;

type ParsedSetCookie = {
  name: string;
  value: string;
  options: {
    path?: string;
    domain?: string;
    maxAge?: number;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  };
};

export function parseSetCookie(raw: string): ParsedSetCookie | null {
  const segments = raw.split(';').map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;
  const [nameValue, ...attrs] = segments;
  const eq = nameValue.indexOf('=');
  if (eq < 0) return null;
  const name = nameValue.slice(0, eq).trim();
  const value = decodeURIComponent(nameValue.slice(eq + 1).trim());
  const options: ParsedSetCookie['options'] = {};
  for (const attr of attrs) {
    const [rawKey, rawVal] = attr.split('=');
    const key = rawKey.toLowerCase().trim();
    const val = rawVal?.trim();
    switch (key) {
      case 'path':
        options.path = val;
        break;
      case 'domain':
        options.domain = val;
        break;
      case 'max-age':
        if (val) options.maxAge = Number(val);
        break;
      case 'expires':
        if (val) options.expires = new Date(val);
        break;
      case 'httponly':
        options.httpOnly = true;
        break;
      case 'secure':
        options.secure = true;
        break;
      case 'samesite': {
        const normalized = val?.toLowerCase();
        if (normalized === 'strict' || normalized === 'lax' || normalized === 'none') {
          options.sameSite = normalized;
        }
        break;
      }
    }
  }
  return { name, value, options };
}

export function forwardSetCookies(response: Response, store: CookieStore) {
  const raw = response.headers.getSetCookie?.() ?? [];
  const isDev = process.env.NODE_ENV !== 'production';
  for (const entry of raw) {
    const parsed = parseSetCookie(entry);
    if (!parsed) continue;
    const options = { ...parsed.options };
    // The backend may scope cookies to /auth; rewrite to / so they reach our
    // Server Actions on any frontend route before being forwarded back to the
    // backend via the Cookie header.
    options.path = '/';
    // Drop Secure on http://localhost — otherwise the browser refuses to store
    // the cookie and the next request has nothing to forward.
    if (isDev) options.secure = false;
    store.set(parsed.name, parsed.value, options);
  }
}
