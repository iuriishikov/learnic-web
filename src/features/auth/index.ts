export { AuthLayout } from './components/auth-layout';

export { LoginForm } from './components/login-form';
export { loginAction } from './api/login';
export { loginSchema, type LoginInput } from './model/login';

export { RegisterForm } from './components/register-form';
export { registerAction } from './api/registration';
export { registerSchema, type RegisterInput } from './model/registration';

export { VerifyEmailClient } from './components/verify-email-client';
export {
  verifyEmailAction,
  waitForEmailVerificationAction,
  hasSignupSessionAction,
} from './api/email-verification';
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
export { AuthProvider, useAuth } from './components/auth-provider';
export type { User } from './model/user';

export type {
  AuthError,
  AuthResult,
  FieldName,
  WeakPasswordReason,
} from './model/types';
