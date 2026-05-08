const DIGEST_PREFIX = 'HTTP_STATUS:';

export class HttpStatusError extends Error {
  digest: string;
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpStatusError';
    this.status = status;
    this.digest = `${DIGEST_PREFIX}${status}`;
  }
}

export function parseHttpStatusFromDigest(
  digest: string | undefined,
): number | null {
  if (!digest) return null;
  if (!digest.startsWith(DIGEST_PREFIX)) return null;
  const value = Number.parseInt(digest.slice(DIGEST_PREFIX.length), 10);
  return Number.isFinite(value) ? value : null;
}

export type HttpStatusReason =
  | 'bad-request'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'service-unavailable'
  | 'network'
  | 'unknown';

const REASON_TO_STATUS: Record<HttpStatusReason, number> = {
  'bad-request': 400,
  unauthorized: 401,
  forbidden: 403,
  'not-found': 404,
  'service-unavailable': 503,
  network: 500,
  unknown: 500,
};

export function httpStatusForReason(
  reason: HttpStatusReason,
  message?: string,
): HttpStatusError {
  return new HttpStatusError(REASON_TO_STATUS[reason], message);
}
