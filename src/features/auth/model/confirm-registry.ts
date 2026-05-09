import type { ComponentType } from 'react';

/**
 * Specialized renderers for unified `/confirm/<purpose>` confirmations.
 *
 * The registry is **forward-looking**: any confirm purpose with a real
 * "click → consume → done" UX is handled by `GenericConfirmClient` via
 * fallback. Add an entry here only when a purpose needs more than the
 * generic flow can express — e.g. a follow-up form field, a special
 * redirect, or copy that diverges from the generic namespace.
 *
 * Keys MUST match the slug the backend embeds in confirmation links
 * (see backend `infrastructure/tasks/handlers/auth_email.py`). Right
 * now no specialized purposes ship — `password-reset` keeps its own
 * `/reset-password` page (separate URL, separate form).
 */

export type ConfirmPurposeEntry = {
  /**
   * Component rendered inside `AuthLayout` at `/confirm/<purpose>`.
   * Receives the raw token from the URL query string.
   */
  Component: ComponentType<{ token: string }>;

  /**
   * `next-intl` namespace driving page title/description. The
   * namespace must define `title` and `description` keys at minimum.
   * The component itself can rely on additional keys it needs.
   */
  namespace: string;
};

export const CONFIRM_REGISTRY: Partial<Record<string, ConfirmPurposeEntry>> = {
  // example (do NOT enable until the backend ships the purpose):
  // 'email-change': {
  //   Component: ConfirmEmailChangeClient,
  //   namespace: 'auth.confirmEmailChange',
  // },
};
