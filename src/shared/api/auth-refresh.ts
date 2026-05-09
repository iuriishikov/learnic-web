import type { NextRequest } from 'next/server';

import { parseSetCookie } from './cookies';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8000';
const REFRESH_PATH = '/auth/refresh';
const REFRESH_TIMEOUT_MS = 10_000;
// Refresh ahead of expiry so an in-flight render never races a token TTL.
// Wide enough to cover small clock drift between frontend and backend hosts.
const EXPIRY_LEEWAY_SEC = 60;

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

type ForwardedCookie = {
  name: string;
  value: string;
  options: NonNullable<ReturnType<typeof parseSetCookie>>['options'];
};

export type RefreshOutcome =
  | { kind: 'unchanged' }
  | { kind: 'fresh'; cookies: ForwardedCookie[] }
  | { kind: 'failed' };

// Single-flight per refresh-token value within this process. Two parallel
// middleware runs (multi-tab navigation, prefetches, RSC payloads) hitting
// the expiry window with the same refresh_token would otherwise race: the
// first rotation marks the token as revoked, and the second presentation of
// the same token triggers backend reuse detection — which kills the entire
// refresh-token family and logs the user out. Keying by the raw cookie
// value (not by user) is correct: rotation only invalidates the exact
// presented token.
const inflight = new Map<string, Promise<RefreshOutcome>>();

export async function refreshTokensIfNeeded(
  request: NextRequest,
): Promise<RefreshOutcome> {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return { kind: 'unchanged' };

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access && !shouldRefresh(access)) return { kind: 'unchanged' };

  const existing = inflight.get(refresh);
  if (existing) return existing;

  const promise = performRefresh(request);
  inflight.set(refresh, promise);
  promise.finally(() => {
    inflight.delete(refresh);
  });
  return promise;
}

async function performRefresh(request: NextRequest): Promise<RefreshOutcome> {
  const cookieHeader = serializeCookies(request);
  // Forward the originating browser identity so the rotated refresh-token
  // row gets the right device metadata for the active-sessions view.
  const outHeaders: Record<string, string> = {};
  if (cookieHeader) outHeaders.cookie = cookieHeader;
  const ua = request.headers.get('user-agent');
  if (ua) outHeaders['user-agent'] = ua;
  const xff = request.headers.get('x-forwarded-for');
  if (xff) outHeaders['x-forwarded-for'] = xff;
  const realIp = request.headers.get('x-real-ip');
  if (realIp) outHeaders['x-real-ip'] = realIp;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
    const response = await fetch(`${API_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers: outHeaders,
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (response.status !== 204) {
      console.warn(
        `[middleware refresh] backend returned ${response.status}`,
      );
      return { kind: 'failed' };
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const raw = response.headers.getSetCookie?.() ?? [];
    const cookies: ForwardedCookie[] = [];
    for (const entry of raw) {
      const parsed = parseSetCookie(entry);
      if (!parsed) continue;
      const options = { ...parsed.options };
      // Force path to '/' so middleware can read refresh_token on every
      // request (backend scopes it to /auth/refresh, which would prevent
      // the browser from ever sending it back to Next.js).
      options.path = '/';
      // Browsers reject Secure cookies on http://localhost.
      if (isDev) options.secure = false;
      cookies.push({ name: parsed.name, value: parsed.value, options });
    }
    return { kind: 'fresh', cookies };
  } catch (err) {
    console.warn('[middleware refresh] fetch failed', err);
    return { kind: 'failed' };
  }
}

function serializeCookies(request: NextRequest): string {
  return request.cookies
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
}

function shouldRefresh(accessToken: string): boolean {
  const exp = readJwtExp(accessToken);
  // Unparseable token: treat as suspect and refresh defensively rather than
  // assume it's still valid.
  if (exp === null) return true;
  return Date.now() / 1000 + EXPIRY_LEEWAY_SEC >= exp;
}

function readJwtExp(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const payload = decodeBase64Url(parts[1]);
  if (!payload) return null;
  try {
    const parsed = JSON.parse(payload) as { exp?: unknown };
    return typeof parsed.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(input: string): string | null {
  try {
    const padded = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4;
    const full = padding ? padded + '='.repeat(4 - padding) : padded;
    return atob(full);
  } catch {
    return null;
  }
}
