'use server';

import { apiFetch } from '@/shared/api/client';
import type { ResourceLimitInfo } from '@/shared/api/resource-limit';

import {
  type MutationResult,
  conflictResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

export type NoteReleaseKind = 'major' | 'minor' | 'patch';

export type NoteReleaseVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type NoteReleaseSummary = {
  id: string;
  ordinal: number;
  version: NoteReleaseVersion;
  kind: NoteReleaseKind;
  notes: string | null;
  releasedAt: string;
  releasedBy: string;
};

type ReleaseSummaryResponse = {
  oid: string;
  ordinal: number;
  version: NoteReleaseVersion;
  kind: NoteReleaseKind;
  notes: string | null;
  released_at: string;
  released_by: string;
};

function fromReleaseResponse(raw: ReleaseSummaryResponse): NoteReleaseSummary {
  return {
    id: raw.oid,
    ordinal: raw.ordinal,
    version: raw.version,
    kind: raw.kind,
    notes: raw.notes,
    releasedAt: raw.released_at,
    releasedBy: raw.released_by,
  };
}

export type ListReleasesResult =
  | { ok: true; releases: NoteReleaseSummary[] }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'not-a-note'
        | 'network'
        | 'unknown';
    };

export async function listNoteReleasesAction(
  noteId: string,
): Promise<ListReleasesResult> {
  let res: Response;
  try {
    res = await apiFetch(`/notes/${encodeURIComponent(noteId)}/releases`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'not-a-note' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as ReleaseSummaryResponse[];
  return { ok: true, releases: raw.map(fromReleaseResponse) };
}

/**
 * Releases an enrolled student can switch their OWN enrollment to
 * (`GET /users/me/enrollments/{enrollment_id}/releases`). Caller-scoped —
 * the student does not need `READ_PRODUCT`; a missing or foreign enrollment
 * comes back as `not-found`.
 */
export async function listMyEnrollmentReleasesAction(
  enrollmentId: string,
): Promise<ListReleasesResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/me/enrollments/${encodeURIComponent(enrollmentId)}/releases`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as ReleaseSummaryResponse[];
  return { ok: true, releases: raw.map(fromReleaseResponse) };
}

/**
 * Re-pin the current user's own enrollment to a different release
 * (`PATCH /users/me/enrollments/{enrollment_id}/release`). The student-side
 * counterpart of the author re-pin: no `MANAGE_RELEASES` needed, only
 * ownership of the enrollment. A revoked enrollment yields a 409 `conflict`.
 */
export async function repinMyEnrollmentAction(args: {
  enrollmentId: string;
  releaseId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/users/me/enrollments/${encodeURIComponent(args.enrollmentId)}/release`,
      { method: 'PATCH', body: { release_id: args.releaseId } },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}

export type CreateReleaseResult =
  | { ok: true; release: NoteReleaseSummary }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
      message?: string;
      resourceLimit?: ResourceLimitInfo;
    };

export async function createNoteReleaseAction(args: {
  noteId: string;
  kind: NoteReleaseKind;
  notes: string | null;
}): Promise<CreateReleaseResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/releases`,
      {
        method: 'POST',
        body: { kind: args.kind, notes: args.notes },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 201) {
    const raw = (await res.json()) as ReleaseSummaryResponse;
    return { ok: true, release: fromReleaseResponse(raw) };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return conflictResult(res);
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function resetNoteDraftAction(args: {
  noteId: string;
  releaseId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(args.noteId)}/draft/reset`,
      {
        method: 'POST',
        body: { release_id: args.releaseId },
      },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }
  return mapMutationStatus(res.status) ?? { ok: false, reason: 'unknown' };
}
