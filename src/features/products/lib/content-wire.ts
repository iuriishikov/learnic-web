/**
 * Wire types + mapper for the learner-facing public note-content tree
 * (`GET /notes/{id}/content`, response `PublicNoteReleaseContentSchema`).
 *
 * The release carries FULL, renderable block payloads — both the landing's
 * curriculum preview and the in-product reader consume the same tree. The
 * seven non-interactive block payloads (html, katex, rutube_video, code,
 * file, video_file, photo_collage) are byte-identical to the draft wire, so
 * their mappers are reused from `draft-wire.ts` via `fromSharedBlockResponse`.
 * The only difference is the interactive blocks: the public wire strips the
 * answer keys, so single/multi choice expose `options` without the correct
 * option(s), and text input exposes only the normalisation flags — those are
 * mapped locally here.
 *
 * Field-name convention: snake_case on the wire (mirrors the backend Pydantic
 * schemas), camelCase in the domain types.
 */

import {
  fromSharedBlockResponse,
  type ChoiceOptionResponse,
  type CodeBlockResponse,
  type FileBlockResponse,
  type FunctionGraphBlockResponse,
  type HtmlBlockResponse,
  type KatexBlockResponse,
  type PhotoCollageBlockResponse,
  type RutubeVideoBlockResponse,
  type VideoFileBlockResponse,
} from './draft-wire';
import type {
  PublicLessonBlock,
  PublicNoteContent,
  PublicLesson,
  PublicModule,
} from '../model/public-content';

type PublicSingleChoiceBlockResponse = {
  type: 'single_choice';
  oid: string;
  position: number;
  options: ChoiceOptionResponse[];
};

type PublicMultiChoiceBlockResponse = {
  type: 'multi_choice';
  oid: string;
  position: number;
  options: ChoiceOptionResponse[];
};

type PublicTextInputBlockResponse = {
  type: 'text_input';
  oid: string;
  position: number;
  case_sensitive: boolean;
  trim_whitespace: boolean;
};

type PublicBlockResponse =
  | HtmlBlockResponse
  | KatexBlockResponse
  | RutubeVideoBlockResponse
  | CodeBlockResponse
  | PublicSingleChoiceBlockResponse
  | PublicMultiChoiceBlockResponse
  | PublicTextInputBlockResponse
  | FileBlockResponse
  | VideoFileBlockResponse
  | PhotoCollageBlockResponse
  | FunctionGraphBlockResponse;

type PublicLessonResponse = {
  oid: string;
  title: string;
  position: number;
  blocks: PublicBlockResponse[];
};

type PublicModuleResponse = {
  oid: string;
  title: string;
  description: string | null;
  position: number;
  lessons: PublicLessonResponse[];
};

export type PublicNoteContentResponse = {
  release_id: string;
  note_id: string;
  modules: PublicModuleResponse[];
};

function fromBlockResponse(raw: PublicBlockResponse): PublicLessonBlock {
  if (raw.type === 'single_choice') {
    return {
      type: 'single_choice',
      id: raw.oid,
      position: raw.position,
      options: raw.options.map((o) => ({ oid: o.oid, label: o.label })),
    };
  }
  if (raw.type === 'multi_choice') {
    return {
      type: 'multi_choice',
      id: raw.oid,
      position: raw.position,
      options: raw.options.map((o) => ({ oid: o.oid, label: o.label })),
    };
  }
  if (raw.type === 'text_input') {
    return {
      type: 'text_input',
      id: raw.oid,
      position: raw.position,
      caseSensitive: raw.case_sensitive,
      trimWhitespace: raw.trim_whitespace,
    };
  }
  return fromSharedBlockResponse(raw);
}

export function fromPublicNoteContentResponse(
  raw: PublicNoteContentResponse,
): PublicNoteContent {
  return {
    noteId: raw.note_id,
    releaseId: raw.release_id,
    modules: [...raw.modules]
      .sort((a, b) => a.position - b.position)
      .map(fromModuleResponse),
  };
}

function fromModuleResponse(raw: PublicModuleResponse): PublicModule {
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

function fromLessonResponse(raw: PublicLessonResponse): PublicLesson {
  return {
    id: raw.oid,
    title: raw.title,
    position: raw.position,
    blocks: [...raw.blocks]
      .sort((a, b) => a.position - b.position)
      .map(fromBlockResponse),
  };
}
