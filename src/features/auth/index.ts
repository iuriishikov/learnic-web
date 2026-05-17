export { AuthLayout } from './components/auth-layout';

export { LoginForm } from './components/login-form';
export { loginAction } from './api/login';
export { loginSchema, type LoginInput } from './model/login';

export { RegisterForm } from './components/register-form';
export { registerAction } from './api/registration';
export { registerSchema, type RegisterInput } from './model/registration';

export { VerifyEmailClient } from './components/verify-email-client';
export { GenericConfirmClient } from './components/generic-confirm-client';
export {
  verifyEmailAction,
  waitForEmailVerificationAction,
  hasSignupSessionAction,
  resendVerificationAction,
  type ResendVerificationResult,
} from './api/email-verification';
export {
  verifyTokenAction,
  getTokenStatusAction,
} from './api/confirm';
export {
  verifyTokenSchema,
  type VerifyTokenInput,
  type VerifyTokenResult,
  type TokenStatusResult,
} from './model/confirm';
export {
  verifyEmailSchema,
  type VerifyEmailInput,
} from './model/email-verification';

export { ForgotPasswordForm } from './components/forgot-password-form';
export { ResetPasswordForm } from './components/reset-password-form';
export {
  requestPasswordResetAction,
  confirmPasswordResetAction,
} from './api/password-reset';
export {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from './model/password-reset';

export {
  refreshTokensAction,
  logoutAction,
  logoutAllAction,
} from './api/session';

export { getMeAction, type GetMeResult } from './api/me';
export { AuthProvider } from './components/auth-provider';
// `useAuth` now lives in `@/shared/auth` — it is consumed cross-feature
// (presence, products, web-push, user-contacts, user-experiences) so
// pinning it to the auth feature would force every consumer into a
// feature-to-feature import.
export type { User } from './model/user';
export {
  CONFIRM_REGISTRY,
  type ConfirmPurposeEntry,
} from './model/confirm-registry';

export { ProfileForm } from './components/profile-form';
export { AvatarUploader } from './components/avatar-uploader';
export { CoverUploader } from './components/cover-uploader';
export { updateProfileAction } from './api/profile-update';
export { uploadAvatarAction, deleteAvatarAction } from './api/avatar';
export { uploadCoverAction, deleteCoverAction } from './api/cover';
export {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from './model/profile-update';

export { ActiveSessionsList } from './components/active-sessions-list';
export {
  listActiveSessionsAction,
  revokeActiveSessionAction,
  type ListActiveSessionsResult,
} from './api/active-sessions';
export type { ActiveSession } from './model/sessions';

export { PasswordResetButton } from './components/password-reset-button';
export { PasswordResetDialog } from './components/password-reset-dialog';

export type {
  AuthError,
  AuthResult,
  FieldName,
  WeakPasswordReason,
} from './model/types';
