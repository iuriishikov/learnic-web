import 'server-only';

import { apiFetch } from '@/shared/api/client';

/**
 * Per-block answer checking and answer reveal against a published note
 * release. Both endpoints require auth AND an active enrollment — a caller
 * who isn't actively enrolled gets a 404 (the backend hides the block's
 * existence rather than leaking a 403). The grading happens entirely on
 * the server; the SPA never sees the correct answer key on `check`.
 *
 * Field-name convention: snake_case on the wire, camelCase in these
 * domain types — mapped at this boundary.
 */

export type CheckAnswerPayload =
  | { type: 'single_choice'; optionId: string }
  | { type: 'multi_choice'; optionIds: string[] }
  | { type: 'text_input'; answer: string };

export type CheckBlockAnswerResult =
  | { ok: true; isCorrect: boolean }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'not-found'
        | 'conflict'
        | 'validation'
        | 'network'
        | 'unknown';
    };

type CheckSingleChoiceBody = { type: 'single_choice'; option_id: string };
type CheckMultiChoiceBody = { type: 'multi_choice'; option_ids: string[] };
type CheckTextInputBody = { type: 'text_input'; answer: string };
type CheckBody =
  | CheckSingleChoiceBody
  | CheckMultiChoiceBody
  | CheckTextInputBody;

function toCheckBody(payload: CheckAnswerPayload): CheckBody {
  switch (payload.type) {
    case 'single_choice':
      return { type: 'single_choice', option_id: payload.optionId };
    case 'multi_choice':
      return { type: 'multi_choice', option_ids: [...payload.optionIds] };
    case 'text_input':
      return { type: 'text_input', answer: payload.answer };
  }
}

type BlockCheckResultResponse = { is_correct: boolean };

export async function checkBlockAnswer(
  noteId: string,
  blockId: string,
  payload: CheckAnswerPayload,
): Promise<CheckBlockAnswerResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/release-blocks/${encodeURIComponent(blockId)}/check`,
      { method: 'POST', body: toCheckBody(payload) },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'conflict' };
  if (res.status === 422) return { ok: false, reason: 'validation' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as BlockCheckResultResponse;
  return { ok: true, isCorrect: raw.is_correct };
}

export type RevealedAnswer =
  | { type: 'single_choice'; optionId: string }
  | { type: 'multi_choice'; optionIds: string[] }
  | { type: 'text_input'; answers: string[] };

export type RevealBlockAnswerResult =
  | { ok: true; revealed: RevealedAnswer }
  | {
      ok: false;
      reason:
        | 'unauthorized'
        | 'not-found'
        | 'conflict'
        | 'network'
        | 'unknown';
    };

type RevealedResponse =
  | { type: 'single_choice'; option_id: string }
  | { type: 'multi_choice'; option_ids: string[] }
  | { type: 'text_input'; answers: string[] };

function fromRevealedResponse(raw: RevealedResponse): RevealedAnswer {
  switch (raw.type) {
    case 'single_choice':
      return { type: 'single_choice', optionId: raw.option_id };
    case 'multi_choice':
      return { type: 'multi_choice', optionIds: [...raw.option_ids] };
    case 'text_input':
      return { type: 'text_input', answers: [...raw.answers] };
  }
}

export async function revealBlockAnswer(
  noteId: string,
  blockId: string,
): Promise<RevealBlockAnswerResult> {
  let res: Response;
  try {
    res = await apiFetch(
      `/notes/${encodeURIComponent(noteId)}/release-blocks/${encodeURIComponent(blockId)}/reveal`,
      { method: 'POST' },
    );
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (res.status === 404) return { ok: false, reason: 'not-found' };
  if (res.status === 409) return { ok: false, reason: 'conflict' };
  if (!res.ok) return { ok: false, reason: 'unknown' };

  const raw = (await res.json()) as RevealedResponse;
  return { ok: true, revealed: fromRevealedResponse(raw) };
}
