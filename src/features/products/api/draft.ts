import 'server-only';

import { apiFetch } from '@/shared/api/client';

import type {
  CourseDraft,
  DraftLesson,
  DraftModule,
  LessonBlock,
} from '../model/draft';

type HtmlBlockResponse = {
  type: 'html';
  oid: string;
  position: number;
  html: string;
};

type KatexBlockResponse = {
  type: 'katex';
  oid: string;
  position: number;
  source: string;
};

type RutubeVideoBlockResponse = {
  type: 'rutube_video';
  oid: string;
  position: number;
  external_id: string;
  embed_url: string;
  title: string | null;
};

type LessonBlockResponse =
  | HtmlBlockResponse
  | KatexBlockResponse
  | RutubeVideoBlockResponse;

type DraftLessonResponse = {
  oid: string;
  title: string;
  position: number;
  blocks: LessonBlockResponse[];
};

type DraftModuleResponse = {
  oid: string;
  title: string;
  description: string | null;
  position: number;
  lessons: DraftLessonResponse[];
};

type CourseDraftResponse = {
  course_id: string;
  modules: DraftModuleResponse[];
  fetched_at: string;
};

export type GetCourseDraftResult =
  | { ok: true; draft: CourseDraft }
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

export async function getCourseDraft(
  courseId: string,
): Promise<GetCourseDraftResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/courses/${encodeURIComponent(courseId)}/content/draft`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 403) return { ok: false, reason: 'forbidden' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'not-a-course' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as CourseDraftResponse;
  return { ok: true, draft: fromCourseDraftResponse(raw) };
}

function fromCourseDraftResponse(raw: CourseDraftResponse): CourseDraft {
  return {
    courseId: raw.course_id,
    fetchedAt: raw.fetched_at,
    modules: [...raw.modules]
      .sort((a, b) => a.position - b.position)
      .map(fromModuleResponse),
  };
}

function fromModuleResponse(raw: DraftModuleResponse): DraftModule {
  return {
    id: raw.oid,
    title: raw.title,
    description: raw.description,
    position: raw.position,
    lessons: [...raw.lessons]
      .sort((a, b) => a.position - b.position)
      .map(fromLessonResponse),
  };
}

function fromLessonResponse(raw: DraftLessonResponse): DraftLesson {
  return {
    id: raw.oid,
    title: raw.title,
    position: raw.position,
    blocks: [...raw.blocks]
      .sort((a, b) => a.position - b.position)
      .map(fromBlockResponse),
  };
}

function fromBlockResponse(raw: LessonBlockResponse): LessonBlock {
  if (raw.type === 'html') {
    return { type: 'html', id: raw.oid, position: raw.position, html: raw.html };
  }
  if (raw.type === 'katex') {
    return {
      type: 'katex',
      id: raw.oid,
      position: raw.position,
      source: raw.source,
    };
  }
  return {
    type: 'rutube_video',
    id: raw.oid,
    position: raw.position,
    externalId: raw.external_id,
    embedUrl: raw.embed_url,
    title: raw.title,
  };
}
