/**
 * Wire types + mappers for the course-draft tree.
 *
 * Used by both the server-only REST loader (`api/draft.ts`) and the
 * client-only content-event handler (`lib/apply-content-event.ts`),
 * which receives the same `LessonBlockSchema` / `CourseDraftLessonSchema`
 * / `CourseDraftModuleSchema` shapes inside event payloads. Keeping
 * the mappers in `lib/` (no server-only marker, no client-only
 * marker) lets both call sites share one source of truth.
 *
 * Field-name convention: snake_case on the wire (mirrors backend
 * Pydantic schemas), camelCase in the domain types.
 */

import { toApiFile, type FileResponse } from '@/shared/types/user';

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

export type ChoiceOptionResponse = {
  oid: string;
  label: string;
};

export type SingleChoiceBlockResponse = {
  type: 'single_choice';
  oid: string;
  position: number;
  options: ChoiceOptionResponse[];
  correct_option_id: string;
};

export type MultiChoiceBlockResponse = {
  type: 'multi_choice';
  oid: string;
  position: number;
  options: ChoiceOptionResponse[];
  correct_option_ids: string[];
};

export type TextInputBlockResponse = {
  type: 'text_input';
  oid: string;
  position: number;
  accepted_answers: string[];
  case_sensitive: boolean;
  trim_whitespace: boolean;
};

export type FileBlockResponse = {
  type: 'file';
  oid: string;
  position: number;
  file: FileResponse | null;
  title: string | null;
};

export type VideoFileBlockResponse = {
  type: 'video_file';
  oid: string;
  position: number;
  file: FileResponse | null;
  title: string | null;
};

export type CollageItemResponse = {
  oid: string;
  file: FileResponse | null;
  caption: string | null;
};

export type PhotoCollageBlockResponse = {
  type: 'photo_collage';
  oid: string;
  position: number;
  items: CollageItemResponse[];
  title: string | null;
};

export type LessonBlockResponse =
  | HtmlBlockResponse
  | KatexBlockResponse
  | RutubeVideoBlockResponse
  | CodeBlockResponse
  | SingleChoiceBlockResponse
  | MultiChoiceBlockResponse
  | TextInputBlockResponse
  | FileBlockResponse
  | VideoFileBlockResponse
  | PhotoCollageBlockResponse;

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
  if (raw.type === 'single_choice') {
    return {
      type: 'single_choice',
      id: raw.oid,
      position: raw.position,
      options: raw.options.map((o) => ({ oid: o.oid, label: o.label })),
      correctOptionId: raw.correct_option_id,
    };
  }
  if (raw.type === 'multi_choice') {
    return {
      type: 'multi_choice',
      id: raw.oid,
      position: raw.position,
      options: raw.options.map((o) => ({ oid: o.oid, label: o.label })),
      correctOptionIds: [...raw.correct_option_ids],
    };
  }
  if (raw.type === 'text_input') {
    return {
      type: 'text_input',
      id: raw.oid,
      position: raw.position,
      acceptedAnswers: [...raw.accepted_answers],
      caseSensitive: raw.case_sensitive,
      trimWhitespace: raw.trim_whitespace,
    };
  }
  if (raw.type === 'file') {
    return {
      type: 'file',
      id: raw.oid,
      position: raw.position,
      file: raw.file !== null ? toApiFile(raw.file) : null,
      title: raw.title,
    };
  }
  if (raw.type === 'video_file') {
    return {
      type: 'video_file',
      id: raw.oid,
      position: raw.position,
      file: raw.file !== null ? toApiFile(raw.file) : null,
      title: raw.title,
    };
  }
  if (raw.type === 'photo_collage') {
    return {
      type: 'photo_collage',
      id: raw.oid,
      position: raw.position,
      items: raw.items.map((it) => ({
        oid: it.oid,
        file: it.file !== null ? toApiFile(it.file) : null,
        caption: it.caption,
      })),
      title: raw.title,
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
