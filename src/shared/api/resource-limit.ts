/**
 * Shared detection + error type for the backend's per-parent count caps.
 *
 * The backend returns HTTP 409 `{"error":"ResourceLimitReached",
 * "resource":"...","limit":N}` when a create would exceed a cap (blocks
 * per lesson, products per author, experiences per user, …). This module
 * is the single place that recognises that shape so every feature wires
 * it the same way:
 *   - server action: `readResourceLimit(res)` → discriminated result
 *   - client mutation: throw `ResourceLimitError` + `showResourceLimit(...)`
 *   - call site: `isResourceLimitError(err)` to skip its generic toast
 */

export type ResourceLimitInfo = {
  /** Stable backend key, e.g. `lesson_block`, `product`. */
  resource: string;
  limit: number;
};

/** Parse a 409 body; returns the limit info only for `ResourceLimitReached`. */
export async function readResourceLimit(
  res: Response,
): Promise<ResourceLimitInfo | null> {
  if (res.status !== 409) return null;
  let body: { error?: unknown; resource?: unknown; limit?: unknown };
  try {
    body = (await res.clone().json()) as typeof body;
  } catch {
    return null;
  }
  if (body.error !== 'ResourceLimitReached') return null;
  return {
    resource: typeof body.resource === 'string' ? body.resource : '',
    limit: typeof body.limit === 'number' ? body.limit : 0,
  };
}

/** Thrown from a client mutation so call sites can skip their generic error UI. */
export class ResourceLimitError extends Error {
  readonly resource: string;
  readonly limit: number;

  constructor(info: ResourceLimitInfo) {
    super('resourceLimit');
    this.name = 'ResourceLimitError';
    this.resource = info.resource;
    this.limit = info.limit;
  }
}

export function isResourceLimitError(
  err: unknown,
): err is ResourceLimitError {
  return err instanceof ResourceLimitError;
}
