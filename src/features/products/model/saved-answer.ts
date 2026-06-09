/**
 * A logged-in learner's persisted submission for one interactive release
 * block, used to restore their selection + verdict when the reader reloads.
 * Mirrors the backend `SavedBlockAnswerSchema` (the submission shares the
 * shape of the `check` request payload). snake_case on the wire is mapped to
 * camelCase at the `api/saved-answers.ts` boundary.
 */
export type SavedAnswerSubmission =
  | { type: 'single_choice'; optionId: string }
  | { type: 'multi_choice'; optionIds: string[] }
  | { type: 'text_input'; answer: string };

export type SavedBlockAnswer = {
  /** Release-side block id the submission belongs to. */
  blockId: string;
  /** Whether the saved submission matched the answer key. */
  isCorrect: boolean;
  submission: SavedAnswerSubmission;
};
