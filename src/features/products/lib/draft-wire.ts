/**
 * Wire types + mappers for the course-draft tree.
 *
 * Used by both the server-only REST loader (`api/draft.ts`) and the
 * client-only WebSocket handler (`api/use-course-content-ws.ts`),
 * which receives the same `LessonBlockSchema` / `CourseDraftLessonSchema`
 * / `CourseDraftModuleSchema` shapes inside event payloads. Keeping
 * the mappers in `lib/` (no server-only marker, no client-only
 * marker) lets both call sites share one source of truth.
 *
 * Field-name convention: snake_case on the wire (mirrors backend
 * Pydantic schemas), camelCase in the domain types.
 */

import type {
  CodeBlockLanguage,
  CourseDraft,
  DraftLesson,
  DraftModule,
  LessonBlock,
} from '../model/draft';

export type HtmlBlockResponse = {
  type: 'html';
  oid: string;
  position: number;
  html: string;
};

export type KatexBlockResponse = {
  type: 'katex';
  oid: string;
  position: number;
  source: string;
};

export type RutubeVideoBlockResponse = {
  type: 'rutube_video';
  oid: string;
  position: number;
  external_id: string;
  embed_url: string;
  title: string | null;
};

export type CodeTabResponse = {
  label: string;
  source: string;
  language: CodeBlockLanguage;
};

export type CodeBlockResponse = {
  type: 'code';
  oid: string;
  position: number;
  tabs: CodeTabResponse[];
};

export type LessonBlockResponse =
  | HtmlBlockResponse
  | KatexBlockResponse
  | RutubeVideoBlockResponse
  | CodeBlockResponse;

export type DraftLessonResponse = {
  oid: string;
  title: string;
  position: number;
  blocks: LessonBlockResponse[];
};

export type DraftModuleResponse = {
  oid: string;
  title: string;
  description: string | null;
  position: number;
  lessons: DraftLessonResponse[];
};

export type CourseDraftResponse = {
  course_id: string;
  modules: DraftModuleResponse[];
  fetched_at: string;
};

export function fromCourseDraftResponse(raw: CourseDraftResponse): CourseDraft {
  return {
    courseId: raw.course_id,
    fetchedAt: raw.fetched_at,
    modules: [...raw.modules]
      .sort((a, b) => a.position - b.position)
      .map(fromModuleResponse),
  };
}

export function fromModuleResponse(raw: DraftModuleResponse): DraftModule {
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

export function fromLessonResponse(raw: DraftLessonResponse): DraftLesson {
  return {
    id: raw.oid,
    title: raw.title,
    position: raw.position,
    blocks: [...raw.blocks]
      .sort((a, b) => a.position - b.position)
      .map(fromBlockResponse),
  };
}

export function fromBlockResponse(raw: LessonBlockResponse): LessonBlock {
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
  if (raw.type === 'code') {
    return {
      type: 'code',
      id: raw.oid,
      position: raw.position,
      tabs: raw.tabs.map((t) => ({
        label: t.label,
        source: t.source,
        language: t.language,
      })),
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
