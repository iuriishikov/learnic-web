import 'server-only';

import { cookies } from 'next/headers';

import { forwardSetCookies } from './cookies';

const API_URL = process.env.API_URL ?? 'http://0.0.0.0:8000';
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

  const refreshed = await sharedRefresh(store);
  if (!refreshed) return response;

  return doRequest();
}

function sharedRefresh(store: CookieStore): Promise<boolean> {
  const existing = refreshInFlight.get(store);
  if (existing) return existing;
  const promise = doRefresh(store);
  refreshInFlight.set(store, promise);
  return promise;
}

async function doRefresh(store: CookieStore): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const headers: Record<string, string> = {};
  const outgoing = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
  if (outgoing) headers.cookie = outgoing;
  try {
    const response = await fetch(`${API_URL}${REFRESH_PATH}`, {
      method: 'POST',
      headers,
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
