import type { NextRequest } from 'next/server';

import { parseSetCookie } from './cookies';

const API_URL = process.env.API_URL ?? 'http://0.0.0.0:8000';
const REFRESH_PATH = '/auth/refresh';
const REFRESH_TIMEOUT_MS = 10_000;
// Refresh ahead of expiry so an in-flight render never races a token TTL.
const EXPIRY_LEEWAY_SEC = 30;

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

export async function refreshTokensIfNeeded(
  request: NextRequest,
): Promise<RefreshOutcome> {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refresh) return { kind: 'unchanged' };

  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  if (access && !shouldRefresh(access)) return { kind: 'unchanged' };

  const cookieHeader = serializeCookies(request);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
    const response = await fetch(`${API_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (response.status !== 204) return { kind: 'failed' };

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
  } catch {
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
  if (exp === null) return false;
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
