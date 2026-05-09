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

const mutableCache = new WeakMap<CookieStore, boolean>();

// cookies() is mutable only inside Server Actions and Route Handlers; in RSC
// render it is read-only and any set/delete throws synchronously. We probe
// once per store with a no-op delete and cache the answer so callers can gate
// behavior that requires writing (e.g. forwarding rotated auth cookies).
export function canMutateCookies(store: CookieStore): boolean {
  const cached = mutableCache.get(store);
  if (cached !== undefined) return cached;
  let mutable: boolean;
  try {
    store.delete('__nx_capability_probe__');
    mutable = true;
  } catch {
    mutable = false;
  }
  mutableCache.set(store, mutable);
  return mutable;
}

export function forwardSetCookies(response: Response, store: CookieStore) {
  const raw = response.headers.getSetCookie?.() ?? [];
  if (raw.length === 0) return;
  // RSC: cookies() is read-only — the proactive refresh in middleware owns
  // this path. Skip silently to avoid noisy try/catch on every Set-Cookie.
  if (!canMutateCookies(store)) return;
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
    try {
      store.set(parsed.name, parsed.value, options);
    } catch (err) {
      console.warn('[apiFetch] forwardSetCookies set failed', err);
    }
  }
}
