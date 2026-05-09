import 'server-only';

import { cookies, headers } from 'next/headers';

import { canMutateCookies, forwardSetCookies } from './cookies';

type ReadonlyHeaders = Awaited<ReturnType<typeof headers>>;

// Forward the originating browser's identity to the backend so device
// metadata (User-Agent, originating IP) is captured on issued/rotated
// refresh-token rows for the active-sessions view. Without this, the
// backend sees Node's default UA and the Next-server's IP.
function applyClientIdentity(
  source: ReadonlyHeaders,
  target: Record<string, string>,
): void {
  const ua = source.get('user-agent');
  if (ua) target['user-agent'] = ua;
  const xff = source.get('x-forwarded-for');
  if (xff) target['x-forwarded-for'] = xff;
  const realIp = source.get('x-real-ip');
  if (realIp) target['x-real-ip'] = realIp;
}

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8000';
const DEFAULT_TIMEOUT_MS = 15_000;

const REFRESH_PATH = '/auth/refresh';
// 401 on these endpoints is meaningful (bad creds, recursion, no-op logout) —
// don't try to refresh in response. Any other 401 triggers a single refresh + retry.
const SKIP_REFRESH_PATHS = new Set<string>([
  REFRESH_PATH,
  '/auth/login',
  '/auth/logout',
  '/auth/logout-all',
]);

type ApiRequestInit = Omit<RequestInit, 'headers' | 'body'> & {
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

// Per-request dedup: parallel apiFetch calls in one Server Action / RSC must
// share a single /auth/refresh — otherwise the second call sends the already-rotated
// refresh_token, the backend treats it as token reuse, and revokes the entire family.
const refreshInFlight = new WeakMap<CookieStore, Promise<boolean>>();

export async function apiFetch(path: string, init: ApiRequestInit = {}) {
  const store = await cookies();
  const requestHeaders = await headers();
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: callerSignal,
    headers: callerHeaders,
    body,
    ...rest
  } = init;

  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  const serializedBody: BodyInit | undefined =
    body === undefined
      ? undefined
      : isFormData
        ? (body as FormData)
        : JSON.stringify(body);

  function buildHeaders(): Record<string, string> {
    const out: Record<string, string> = { ...(callerHeaders ?? {}) };
    if (body !== undefined && !isFormData) {
      out['Content-Type'] = 'application/json';
    }
    applyClientIdentity(requestHeaders, out);
    const outgoing = store
      .getAll()
      .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
      .join('; ');
    if (outgoing) out.cookie = outgoing;
    return out;
  }

  async function doRequest(): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener('abort', () => controller.abort());
    }
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: buildHeaders(),
        body: serializedBody,
        cache: 'no-store',
        signal: controller.signal,
      });
      forwardSetCookies(response, store);
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  const response = await doRequest();
  if (response.status !== 401 || SKIP_REFRESH_PATHS.has(path)) {
    return response;
  }

  // Reactive refresh requires writing rotated cookies back to the response
  // store; in RSC render that store is read-only. Triggering /auth/refresh
  // anyway would rotate the token on the backend with no way to deliver the
  // new cookies to the browser — the browser would keep the now-revoked
  // refresh_token and the next middleware refresh would hit reuse detection.
  // Surface the 401; middleware will refresh proactively on the next request.
  if (!canMutateCookies(store)) {
    console.warn(`[apiFetch] 401 in RSC context; skipping refresh for ${path}`);
    return response;
  }

  const refreshed = await sharedRefresh(store, requestHeaders);
  if (!refreshed) {
    console.warn(`[apiFetch] reactive refresh failed for ${path}`);
    return response;
  }

  return doRequest();
}

function sharedRefresh(
  store: CookieStore,
  requestHeaders: ReadonlyHeaders,
): Promise<boolean> {
  const existing = refreshInFlight.get(store);
  if (existing) return existing;
  const promise = doRefresh(store, requestHeaders);
  refreshInFlight.set(store, promise);
  return promise;
}

async function doRefresh(
  store: CookieStore,
  requestHeaders: ReadonlyHeaders,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const outHeaders: Record<string, string> = {};
  const outgoing = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
  if (outgoing) outHeaders.cookie = outgoing;
  applyClientIdentity(requestHeaders, outHeaders);
  try {
    const response = await fetch(`${API_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers: outHeaders,
      cache: 'no-store',
      signal: controller.signal,
    });
    forwardSetCookies(response, store);
    return response.status === 204;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
