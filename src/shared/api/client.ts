import 'server-only';

import { cookies } from 'next/headers';

import { forwardSetCookies } from './cookies';

const API_URL = process.env.API_URL ?? 'http://0.0.0.0:8000';
const DEFAULT_TIMEOUT_MS = 15_000;

type ApiRequestInit = Omit<RequestInit, 'headers' | 'body'> & {
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export async function apiFetch(path: string, init: ApiRequestInit = {}) {
  const store = await cookies();
  const outgoing = store
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');

  const headers: Record<string, string> = {
    ...(init.headers ?? {}),
  };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (outgoing) headers.cookie = outgoing;

  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...rest } = init;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort();
    else callerSignal.addEventListener('abort', () => controller.abort());
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
      signal: controller.signal,
    });

    forwardSetCookies(response, store);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
