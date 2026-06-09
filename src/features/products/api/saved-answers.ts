import 'server-only';

import { apiFetch } from '@/shared/api/client';

import type {
  SavedAnswerSubmission,
  SavedBlockAnswer,
} from '../model/saved-answer';

/**
 * The current student's saved answers for a note, returned by
 * `GET /notes/{noteId}/release-blocks/answers`. Requires auth; scoped
 * server-side to the release the caller is pinned to, so the answers line up
 * with the content tree. A signed-in caller who is not actively enrolled gets
 * an empty list (not an error), so the reader can call this unconditionally
 * for enrolled viewers and restore selections + verdicts.
 *
 * Field-name convention: snake_case on the wire, camelCase in the domain
 * types — mapped at this boundary.
 */

type SubmissionResponse =
  | { type: 'single_choice'; option_id: string }
  | { type: 'multi_choice'; option_ids: string[] }
  | { type: 'text_input'; answer: string };

type SavedBlockAnswerResponse = {
  block_id: string;
  is_correct: boolean;
  submission: SubmissionResponse;
};

export type GetMySavedAnswersResult =
  | { ok: true; answers: SavedBlockAnswer[] }
  | { ok: false; reason: 'unauthorized' | 'network' | 'unknown' };

function fromSubmissionResponse(raw: SubmissionResponse): SavedAnswerSubmission {
  switch (raw.type) {
    case 'single_choice':
      return { type: 'single_choice', optionId: raw.option_id };
    case 'multi_choice':
      return { type: 'multi_choice', optionIds: [...raw.option_ids] };
    case 'text_input':
      return { type: 'text_input', answer: raw.answer };
  }
}

export async function getMySavedAnswers(
  noteId: string,
): Promise<GetMySavedAnswersResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/release-blocks/answers`,
      { method: 'GET' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as SavedBlockAnswerResponse[];
  return {
    ok: true,
    answers: raw.map((a) => ({
      blockId: a.block_id,
      isCorrect: a.is_correct,
      submission: fromSubmissionResponse(a.submission),
    })),
  };
}
