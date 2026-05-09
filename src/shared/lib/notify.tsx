'use client';

import { useTranslations } from 'next-intl';
import { useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';

import type { SoundCue } from '@/shared/lib/sound';
import {
  ToastCard,
  type ToastAction,
  type ToastAvatarColor,
  type ToastCardProps,
  type ToastTone,
} from '@/shared/ui/toast';

export type ApiErrorReason =
  | 'unauthorized'
  | 'network'
  | 'notFound'
  | 'validation'
  | 'unknown';

export type NotifyOptions = {
  /** Secondary line under the title. */
  description?: ReactNode;
  /** Inline action button (e.g. "Retry", "Open"). */
  action?: ToastAction;
  /** Override Sonner's default duration in ms. Pass `Infinity` to keep open. */
  duration?: number;
  /** Stable id — pass to update/dismiss the same toast later. */
  id?: string | number;
};

export type RichNotifyOptions = NotifyOptions & {
  /** Icon / avatar slot. Replaces the default tone icon. */
  icon?: ReactNode;
  /** Right-aligned secondary line in the title (e.g. timestamps). */
  meta?: string;
};

/** Generic toast — every helper ultimately funnels through these props. */
export type ShowToastInput = Omit<ToastCardProps, 'id' | 'dismissLabel'> & {
  duration?: number;
  id?: string | number;
};

/** Product / release update with optional avatar or hero image. */
export type UpdateToastInput = {
  title: ReactNode;
  description?: ReactNode;
  /** Hero image rendered inline below the description. */
  image?: { src: string; alt?: string };
  /** Avatar in place of the tone icon (e.g. release author). */
  avatar?: { name: string; src?: string; colorIndex?: ToastAvatarColor };
  /** Custom icon. Falls back to the tone icon. */
  icon?: ReactNode;
  tone?: ToastTone;
  action?: ToastAction;
  cancel?: ToastAction;
  duration?: number;
  id?: string | number;
  /** Animates the icon (shake + ripple). For incoming calls / urgent attention. */
  pulse?: boolean;
  /** Plays a short notification cue once on mount. */
  sound?: SoundCue;
};

/** Person-attributed message (mention, comment, incoming chat). */
export type MentionToastInput = {
  user: { name: string; src?: string; colorIndex?: ToastAvatarColor };
  /** e.g. "2 mins ago" / relative time. */
  meta?: string;
  message: ReactNode;
  action?: ToastAction;
  cancel?: ToastAction;
  duration?: number;
  id?: string | number;
};

/** Long-running operation with a progress bar. */
export type ProgressToastInput = {
  title: ReactNode;
  description?: ReactNode;
  value: number;
  /** Caption under the bar (e.g. "60% uploaded…"). */
  label?: string;
  icon?: ReactNode;
  tone?: ToastTone;
  cancel?: ToastAction;
  action?: ToastAction;
  id?: string | number;
};

export type ProgressUpdate = {
  value?: number;
  label?: string;
  title?: ReactNode;
  description?: ReactNode;
};

export type ProgressHandle = {
  id: string | number;
  update: (next: ProgressUpdate) => void;
  finish: (props: Omit<ShowToastInput, 'id'>) => void;
  dismiss: () => void;
};

export type Notifier = {
  /* Type-coloured shorthands */
  success: (message: string, options?: NotifyOptions) => string | number;
  error: (message: string, options?: NotifyOptions) => string | number;
  info: (message: string, options?: NotifyOptions) => string | number;
  warning: (message: string, options?: NotifyOptions) => string | number;

  /** Generic toast (no tone icon by default). Pair with `icon`/`avatar`. */
  message: (
    title: string,
    options?: RichNotifyOptions,
  ) => string | number;

  /** Localized toast for ambient API failures (reads `errors.api.<reason>`). */
  apiError: (reason: ApiErrorReason, override?: string) => string | number;

  /* Rich variants */
  show: (props: ShowToastInput) => string | number;
  update: (props: UpdateToastInput) => string | number;
  mention: (props: MentionToastInput) => string | number;
  progress: (props: ProgressToastInput) => ProgressHandle;

  /** Dismiss a specific toast by id, or all visible toasts when omitted. */
  dismiss: (id?: string | number) => void;
};

/**
 * Single entry-point for all toast-based notifications. Wraps Sonner with the
 * project's custom `<ToastCard>` design and feeds API-error copy through
 * `next-intl`.
 */
export function useNotify(): Notifier {
  const tApi = useTranslations('errors.api');
  const tNotify = useTranslations('notify');

  return useMemo<Notifier>(() => {
    const dismissLabel = tNotify('dismiss');

    function show(props: ShowToastInput): string | number {
      const { duration, id, ...rest } = props;
      // Sonner v2: never spread `id: undefined` into options. `toast.custom`
      // does `{ jsx: jsx(id), id, ...data }`, so an `id: undefined` in `data`
      // overwrites the freshly minted counter id, then `create()` mints
      // *another* one, leaving the rendered card with a stale id whose
      // `toast.dismiss(id)` no longer matches anything.
      const opts: { duration?: number; id?: string | number } = {};
      if (duration !== undefined) opts.duration = duration;
      if (id !== undefined) opts.id = id;
      return toast.custom(
        (toastId) => (
          <ToastCard {...rest} id={toastId} dismissLabel={dismissLabel} />
        ),
        opts,
      );
    }

    return {
      success: (message, options) =>
        show({
          tone: 'success',
          title: message,
          description: options?.description,
          action: options?.action,
          duration: options?.duration,
          id: options?.id,
        }),
      error: (message, options) =>
        show({
          tone: 'error',
          title: message,
          description: options?.description,
          action: options?.action,
          duration: options?.duration,
          id: options?.id,
        }),
      info: (message, options) =>
        show({
          tone: 'info',
          title: message,
          description: options?.description,
          action: options?.action,
          duration: options?.duration,
          id: options?.id,
        }),
      warning: (message, options) =>
        show({
          tone: 'warning',
          title: message,
          description: options?.description,
          action: options?.action,
          duration: options?.duration,
          id: options?.id,
        }),
      message: (title, options) =>
        show({
          tone: 'neutral',
          title,
          description: options?.description,
          icon: options?.icon ?? null,
          meta: options?.meta,
          action: options?.action,
          duration: options?.duration,
          id: options?.id,
        }),
      apiError: (reason, override) =>
        show({
          tone: 'error',
          title: override ?? tApi(reason),
        }),
      show,
      update: ({ tone = 'info', ...rest }) =>
        show({
          tone,
          ...rest,
        }),
      mention: ({ user, meta, message, action, cancel, duration, id }) =>
        show({
          tone: 'neutral',
          avatar: user,
          meta,
          title: user.name,
          description: message,
          action,
          cancel,
          duration,
          id,
        }),
      progress: ({
        title,
        description,
        value,
        label,
        icon,
        tone = 'neutral',
        cancel,
        action,
        id: providedId,
      }) => {
        let currentValue = value;
        let currentLabel = label;
        let currentTitle: ReactNode = title;
        let currentDescription: ReactNode = description;

        const id = show({
          tone,
          title: currentTitle,
          description: currentDescription,
          icon,
          progress: { value: currentValue, label: currentLabel },
          cancel,
          action,
          duration: Infinity,
          hideClose: true,
          id: providedId,
        });

        return {
          id,
          update(next) {
            if (next.value !== undefined) currentValue = next.value;
            if (next.label !== undefined) currentLabel = next.label;
            if (next.title !== undefined) currentTitle = next.title;
            if (next.description !== undefined)
              currentDescription = next.description;
            show({
              tone,
              title: currentTitle,
              description: currentDescription,
              icon,
              progress: { value: currentValue, label: currentLabel },
              cancel,
              action,
              duration: Infinity,
              hideClose: true,
              id,
            });
          },
          finish(props) {
            show({ ...props, id });
          },
          dismiss() {
            toast.dismiss(id);
          },
        };
      },
      dismiss: (id) => {
        toast.dismiss(id);
      },
    };
  }, [tApi, tNotify]);
}
