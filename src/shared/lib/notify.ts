'use client';

import { useTranslations } from 'next-intl';
import { useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';

export type ApiErrorReason =
  | 'unauthorized'
  | 'network'
  | 'notFound'
  | 'validation'
  | 'unknown';

export type NotifyOptions = {
  /** Secondary line under the title. */
  description?: string;
  /** Inline action button (e.g. "Retry", "Open"). */
  action?: { label: string; onClick: () => void };
  /** Override Sonner's default duration in ms. */
  duration?: number;
  /** Stable id — pass to update/dismiss the same toast later. */
  id?: string | number;
};

export type RichNotifyOptions = NotifyOptions & {
  /** Icon / avatar slot. Replaces the default type icon. */
  icon?: ReactNode;
};

export type Notifier = {
  success: (message: string, options?: NotifyOptions) => void;
  error: (message: string, options?: NotifyOptions) => void;
  info: (message: string, options?: NotifyOptions) => void;
  warning: (message: string, options?: NotifyOptions) => void;
  /**
   * Generic toast (no type-specific styling). For things like incoming
   * messenger messages — pass an avatar via `options.icon` and an action
   * button to open the chat.
   */
  message: (title: string, options?: RichNotifyOptions) => void;
  /**
   * Localized toast for ambient API failures. Reads from `errors.api.<reason>`.
   * Pass `override` for feature-specific copy.
   */
  apiError: (reason: ApiErrorReason, override?: string) => void;
  /** Dismiss a specific toast by id, or all visible toasts when omitted. */
  dismiss: (id?: string | number) => void;
};

/**
 * Single entry-point for all toast-based notifications. Wraps Sonner with a
 * stable React-friendly API and feeds API-error copy through `next-intl`.
 */
export function useNotify(): Notifier {
  const tApi = useTranslations('errors.api');

  return useMemo<Notifier>(
    () => ({
      success: (message, options) => {
        toast.success(message, options);
      },
      error: (message, options) => {
        toast.error(message, options);
      },
      info: (message, options) => {
        toast.info(message, options);
      },
      warning: (message, options) => {
        toast.warning(message, options);
      },
      message: (title, options) => {
        toast(title, options);
      },
      apiError: (reason, override) => {
        toast.error(override ?? tApi(reason));
      },
      dismiss: (id) => {
        toast.dismiss(id);
      },
    }),
    [tApi],
  );
}
