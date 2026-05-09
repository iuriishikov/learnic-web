'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { playSound, type SoundCue } from '@/shared/lib/sound';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

export type ToastTone =
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export type ToastAvatarColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ToastAction = {
  label: string;
  onClick?: () => void;
  /** When true the toast stays open after the action runs. Default: dismiss. */
  keepOpen?: boolean;
};

export type ToastCardProps = {
  /** Sonner-provided id. Used to dismiss imperatively from inside the card. */
  id: string | number;
  tone?: ToastTone;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Replaces the tone icon. Pass `null` to render no leading slot. */
  icon?: React.ReactNode;
  hideIcon?: boolean;
  avatar?: { name: string; src?: string; colorIndex?: ToastAvatarColor };
  /** Right-aligned secondary line in the title (e.g. "2 mins ago"). */
  meta?: string;
  image?: { src: string; alt?: string };
  /** 0..100. Pass to render an animated progress bar with optional caption. */
  progress?: { value: number; label?: string };
  /** Bottom-right link-styled button. */
  action?: ToastAction;
  /** Bottom-left button. Defaults to dismissLabel; pass to override copy or behavior. */
  cancel?: ToastAction;
  /** Localized "Dismiss" copy used by the cancel slot when not overridden. */
  dismissLabel: string;
  /** Hides the top-right close X. */
  hideClose?: boolean;
  /** Hides the bottom action row entirely (when no buttons should appear). */
  hideFooter?: boolean;
  /** Animates the leading icon (shake + ping ring). Use for incoming calls / urgent attention. */
  pulse?: boolean;
  /** Plays a short notification cue once on mount. */
  sound?: SoundCue;
};

const TONE_ICON: Record<
  Exclude<ToastTone, 'neutral' | 'brand'>,
  LucideIcon
> = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: TriangleAlertIcon,
  error: CircleAlertIcon,
};

const TONE_BADGE: Record<ToastTone, string> = {
  brand: 'bg-brand/12 text-brand ring-1 ring-brand/25 ring-inset',
  info: 'bg-brand/12 text-brand ring-1 ring-brand/25 ring-inset',
  success: 'bg-online/15 text-online ring-1 ring-online/30 ring-inset',
  warning: 'bg-warning/15 text-warning ring-1 ring-warning/35 ring-inset',
  error:
    'bg-destructive/15 text-destructive ring-1 ring-destructive/30 ring-inset',
  neutral: 'bg-muted text-muted-foreground ring-1 ring-border ring-inset',
};

const AVATAR_BG: Record<ToastAvatarColor, string> = {
  1: 'bg-avatar-1 text-avatar-foreground',
  2: 'bg-avatar-2 text-avatar-foreground',
  3: 'bg-avatar-3 text-avatar-foreground',
  4: 'bg-avatar-4 text-avatar-foreground',
  5: 'bg-avatar-5 text-avatar-foreground',
  6: 'bg-avatar-6 text-avatar-foreground',
  7: 'bg-avatar-7 text-avatar-foreground',
  8: 'bg-avatar-8 text-avatar-foreground',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ToastCard({
  id,
  tone = 'info',
  title,
  description,
  icon,
  hideIcon,
  avatar,
  meta,
  image,
  progress,
  action,
  cancel,
  dismissLabel,
  hideClose,
  hideFooter,
  pulse,
  sound,
}: ToastCardProps) {
  React.useEffect(() => {
    if (!sound) return;
    return playSound(sound);
  }, [sound]);

  const handleDismiss = React.useCallback(() => toast.dismiss(id), [id]);

  const handleAction = React.useCallback(() => {
    action?.onClick?.();
    if (!action?.keepOpen) toast.dismiss(id);
  }, [action, id]);

  const handleCancel = React.useCallback(() => {
    cancel?.onClick?.();
    if (!cancel?.keepOpen) toast.dismiss(id);
  }, [cancel, id]);

  const ToneIcon =
    tone !== 'brand' && tone !== 'neutral' ? TONE_ICON[tone] : null;

  const showLeading =
    !hideIcon && (avatar || icon !== undefined || ToneIcon !== null);
  const showFooter = !hideFooter && (action || cancel);
  const cancelLabel = cancel?.label ?? dismissLabel;
  const showCancel = !hideFooter && (cancel || action);

  const clampedProgress = progress
    ? Math.max(0, Math.min(100, progress.value))
    : 0;

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.6 }}
      className={cn(
        'pointer-events-auto relative w-full overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground',
        'shadow-[0_12px_38px_-14px_rgba(15,23,42,0.18),0_2px_6px_-2px_rgba(15,23,42,0.06)]',
        'dark:shadow-[0_18px_60px_-16px_rgba(0,0,0,0.65),0_2px_6px_-2px_rgba(0,0,0,0.4)]',
        'backdrop-blur-[2px]',
      )}
    >
      <div className="flex gap-3 p-3.5">
        {showLeading ? (
          <div className="flex shrink-0 items-start pt-px">
            {avatar ? (
              <Avatar
                size="default"
                className={cn(
                  'size-8 ring-1 ring-border',
                  avatar.colorIndex ? AVATAR_BG[avatar.colorIndex] : '',
                )}
              >
                {avatar.src ? (
                  <AvatarImage src={avatar.src} alt={avatar.name} />
                ) : null}
                <AvatarFallback
                  className={cn(
                    'text-[11px] font-semibold',
                    avatar.colorIndex
                      ? AVATAR_BG[avatar.colorIndex]
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {getInitials(avatar.name)}
                </AvatarFallback>
              </Avatar>
            ) : pulse ? (
              <span aria-hidden className="relative mt-px inline-flex size-7 items-center justify-center">
                <span
                  className={cn(
                    'absolute inset-0 rounded-full opacity-70',
                    TONE_BADGE[tone],
                  )}
                  style={{
                    animation:
                      'toast-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite',
                  }}
                />
                <motion.span
                  animate={{
                    rotate: [0, -14, 14, -10, 10, -6, 6, 0],
                    scale: [1, 1.06, 1, 1.04, 1],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    repeatDelay: 0.4,
                    ease: 'easeInOut',
                  }}
                  className={cn(
                    'relative inline-flex size-7 items-center justify-center rounded-full [&>svg]:size-4',
                    TONE_BADGE[tone],
                  )}
                >
                  {icon !== undefined
                    ? icon
                    : ToneIcon
                      ? <ToneIcon className="size-4" strokeWidth={2.2} />
                      : null}
                </motion.span>
              </span>
            ) : (
              <span
                aria-hidden
                className={cn(
                  'mt-px inline-flex size-7 items-center justify-center rounded-full [&>svg]:size-4',
                  TONE_BADGE[tone],
                )}
              >
                {icon !== undefined
                  ? icon
                  : ToneIcon
                    ? <ToneIcon className="size-4" strokeWidth={2.2} />
                    : null}
              </span>
            )}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <p className="min-w-0 flex-1 truncate text-[13.5px] leading-5 font-semibold tracking-tight text-foreground">
                  {title}
                </p>
                {meta ? (
                  <span className="shrink-0 text-[11.5px] leading-5 font-normal text-muted-foreground">
                    {meta}
                  </span>
                ) : null}
              </div>
              {description ? (
                <p className="mt-0.5 text-[13px] leading-[1.45] text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            {!hideClose ? (
              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  '-mt-1 -mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/80 transition-colors',
                  'hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:outline-none',
                )}
                aria-label={dismissLabel}
              >
                <XIcon className="size-3.5" strokeWidth={2.2} />
              </button>
            ) : null}
          </div>

          {image ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.alt ?? ''}
                className="block aspect-[16/9] w-full object-cover"
              />
            </div>
          ) : null}

          {progress ? (
            <div className="mt-3 space-y-1.5">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand"
                  initial={{ width: 0 }}
                  animate={{ width: `${clampedProgress}%` }}
                  transition={{ type: 'spring', stiffness: 90, damping: 22 }}
                />
              </div>
              {progress.label ? (
                <p className="text-right text-[11.5px] text-muted-foreground tabular-nums">
                  {progress.label}
                </p>
              ) : null}
            </div>
          ) : null}

          {showFooter ? (
            <div className="mt-3 flex items-center gap-4 text-[13px] font-medium">
              {showCancel ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className={cn(
                    'transition-colors',
                    'text-muted-foreground hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
                  )}
                >
                  {cancelLabel}
                </button>
              ) : null}
              {action ? (
                <button
                  type="button"
                  onClick={handleAction}
                  className={cn(
                    'transition-colors focus-visible:outline-none',
                    'text-brand hover:text-brand/80 focus-visible:text-brand/80',
                  )}
                >
                  {action.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
