'use server';

import { apiFetch } from '@/shared/api/client';

import {
  type MutationResult,
  mapMutationStatus,
  safeJson,
} from './_shared';

export type CourseReleaseKind = 'major' | 'minor' | 'patch';

export type CourseReleaseVersion = {
  major: number;
  minor: number;
  patch: number;
};

export type CourseReleaseSummary = {
  id: string;
  ordinal: number;
  version: CourseReleaseVersion;
  kind: CourseReleaseKind;
  notes: string | null;
  releasedAt: string;
  releasedBy: string;
};

type ReleaseSummaryResponse = {
  oid: string;
  ordinal: number;
  version: CourseReleaseVersion;
  kind: CourseReleaseKind;
  notes: string | null;
  released_at: string;
  released_by: string;
};

function fromReleaseResponse(raw: ReleaseSummaryResponse): CourseReleaseSummary {
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
  | { ok: true; releases: CourseReleaseSummary[] }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'forbidden'
        | 'not-found'
        | 'not-a-course'
        | 'network'
        | 'unknown';
    };

export async function listCourseReleasesAction(
  courseId: string,
): Promise<ListReleasesResult> {
  let res: Response;
  try {
    res = await apiFetch(`/courses/${encodeURIComponent(courseId)}/releases`, {
      method: 'GET',
    });
  } catch {
    return { ok: false, reason: 'network' };
  }
  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'not-a-course' };
  if (!res.ok) return { ok: false, reason: 'unknown' };
  const raw = (await res.json()) as ReleaseSummaryResponse[];
  return { ok: true, releases: raw.map(fromReleaseResponse) };
}

export type CreateReleaseResult =
  | { ok: true; release: CourseReleaseSummary }
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
    };

export async function createCourseReleaseAction(args: {
  courseId: string;
  kind: CourseReleaseKind;
  notes: string | null;
}): Promise<CreateReleaseResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(args.courseId)}/releases`,
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
  if (res.status === 409) return { ok: false, reason: 'conflict' };
  if (res.status === 422) {
    const body = await safeJson(res);
    const message = typeof body?.error === 'string' ? body.error : undefined;
    return { ok: false, reason: 'validation', message };
  }
  return { ok: false, reason: 'unknown' };
}

export async function resetCourseDraftAction(args: {
  courseId: string;
  releaseId: string;
}): Promise<MutationResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(args.courseId)}/draft/reset`,
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
