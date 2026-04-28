import 'server-only';

import type { AuthError, FieldName, WeakPasswordReason } from '../model/types';

export async function safeErrorMessage(
  res: Response,
): Promise<string | undefined> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error;
  } catch {
    return undefined;
  }
}

type FieldErrorBody = {
  error?: string;
  reason?: string;
  field?: string;
  limit?: number;
  // FastAPI 422 (HTTPValidationError) — present when Pydantic itself rejects
  // the body before reaching the domain. Distinct from FieldErrorResponseModel.
  detail?: unknown;
};

const SNAKE_TO_CAMEL_FIELD: Record<string, FieldName> = {
  first_name: 'firstName',
  last_name: 'lastName',
  patronymic: 'patronymic',
  description: 'description',
};

const WEAK_PASSWORD_REASONS: Record<string, WeakPasswordReason> = {
  too_short: 'tooShort',
  too_long: 'tooLong',
  missing_digit: 'missingDigit',
  missing_uppercase: 'missingUppercase',
  missing_lowercase: 'missingLowercase',
  missing_special: 'missingSpecial',
};

const TOO_LONG_ERROR_TO_FIELD: Record<string, FieldName> = {
  FirstNameTooLongError: 'firstName',
  LastNameTooLongError: 'lastName',
  PatronymicTooLongError: 'patronymic',
  DescriptionTooLongError: 'description',
};

export async function parseFieldError(res: Response): Promise<{
  body: FieldErrorBody | null;
  error: AuthError;
}> {
  let body: FieldErrorBody | null = null;
  try {
    body = (await res.json()) as FieldErrorBody;
  } catch {
    body = null;
  }

  const code = body?.error;

  if (code === 'WeakPasswordError') {
    const reason = body?.reason
      ? (WEAK_PASSWORD_REASONS[body.reason] ?? 'unknown')
      : undefined;
    return { body, error: { kind: 'weakPassword', reason } };
  }

  if (code === 'InvalidEmailError') {
    return { body, error: { kind: 'invalidEmail' } };
  }

  if (code && TOO_LONG_ERROR_TO_FIELD[code]) {
    return {
      body,
      error: {
        kind: 'fieldTooLong',
        field: TOO_LONG_ERROR_TO_FIELD[code],
        limit: typeof body?.limit === 'number' ? body.limit : undefined,
      },
    };
  }

  // Generic FieldError with `field` populated — best-effort map by snake_case.
  if (body?.field && SNAKE_TO_CAMEL_FIELD[body.field]) {
    return {
      body,
      error: {
        kind: 'validation',
        fields: { [SNAKE_TO_CAMEL_FIELD[body.field]]: code ?? 'invalid' },
      },
    };
  }

  return { body, error: { kind: 'validation' } };
}
