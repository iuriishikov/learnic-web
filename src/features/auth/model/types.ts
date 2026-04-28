export type AuthResult =
  | { ok: true }
  | { ok: false; error: AuthError };

export type WeakPasswordReason =
  | 'tooShort'
  | 'tooLong'
  | 'missingDigit'
  | 'missingUppercase'
  | 'missingLowercase'
  | 'missingSpecial'
  | 'unknown';

export type FieldName = 'firstName' | 'lastName' | 'patronymic' | 'description';

export type AuthError =
  | { kind: 'invalidCredentials' }
  | { kind: 'emailTaken' }
  | { kind: 'emailNotVerified' }
  | { kind: 'invalidToken' }
  | { kind: 'invalidEmail' }
  | { kind: 'weakPassword'; reason?: WeakPasswordReason }
  | { kind: 'fieldTooLong'; field: FieldName; limit?: number }
  | { kind: 'validation'; fields?: Record<string, string> }
  | { kind: 'network' }
  | { kind: 'unknown'; message?: string };
