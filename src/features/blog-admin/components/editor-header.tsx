'use client';

import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Trash2Icon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import type { BlogPostStatus } from '../model/types';
import { StatusBadge } from './status-badge';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Sticky offset for surfaces docked under the main app header.
 * Mirrors `AppHeader`'s `h-[72px]` + 1px bottom border (same value the
 * `AppSubHeader` sticks to with `top-[73px]`). Used both as the Tailwind
 * `top-[73px]` class on the sticky bar and as the IntersectionObserver
 * top margin so the bar appears exactly when the full header tucks under
 * the app header.
 */
const APP_HEADER_OFFSET = 73;

type EditorHeaderProps = {
  title: string;
  slug: string;
  status: BlogPostStatus;
  saveState: SaveState;
  busy: boolean;
  slugError: string | null;
  onTitleCommit: (title: string) => void;
  onSlugCommit: (slug: string) => void;
  onPublishToggle: () => void;
  onDelete: () => void;
  /** Post-settings slot (e.g. the cover control) shown above the divider. */
  cover?: ReactNode;
};

export function EditorHeader({
  title,
  slug,
  status,
  saveState,
  busy,
  slugError,
  onTitleCommit,
  onSlugCommit,
  onPublishToggle,
  onDelete,
  cover,
}: EditorHeaderProps) {
  const t = useTranslations('blog-admin');
  const published = status === 'published';

  // When the full header scrolls up under the app header, reveal a condensed
  // sticky bar. Observed against a root inset by the app-header height so the
  // toggle fires exactly at the dock line, not at the viewport top.
  const headerRef = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${APP_HEADER_OFFSET}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="flex flex-col gap-3 border-b border-border pb-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('editor.back')}
          </Link>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <SaveIndicator state={saveState} />
            {published ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(`/blog/${slug}`, '_blank', 'noopener')
                }
              >
                <ExternalLinkIcon data-icon="inline-start" />
                {t('actions.viewPublic')}
              </Button>
            ) : null}
            <Button
              variant={published ? 'secondary' : 'default'}
              size="sm"
              disabled={busy}
              onClick={onPublishToggle}
            >
              {published ? t('actions.unpublish') : t('actions.publish')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('list.delete')}
              disabled={busy}
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>

        {cover}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <InlineText
              value={title}
              onCommit={onTitleCommit}
              ariaLabel={t('editor.titleLabel')}
              className="flex-1 text-2xl font-semibold tracking-tight md:text-3xl"
            />
            <StatusBadge status={status} className="shrink-0" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="select-none">/blog/</span>
              <InlineText
                value={slug}
                onCommit={onSlugCommit}
                ariaLabel={t('editor.slugLabel')}
                className="font-mono text-sm text-foreground"
              />
            </div>
            {slugError ? (
              <span role="alert" className="text-xs font-medium text-destructive">
                {slugError}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <EditorStickyBar
        visible={stuck}
        title={title}
        slug={slug}
        status={status}
        saveState={saveState}
        busy={busy}
        onPublishToggle={onPublishToggle}
        onDelete={onDelete}
      />
    </>
  );
}

type EditorStickyBarProps = {
  visible: boolean;
  title: string;
  slug: string;
  status: BlogPostStatus;
  saveState: SaveState;
  busy: boolean;
  onPublishToggle: () => void;
  onDelete: () => void;
};

/**
 * Condensed header that appears once the full editor header scrolls out of
 * view. Full-bleed bar docked under the app header (`top-[73px]`), with its
 * content capped at the same `max-w-[1440px]` container as the app header so
 * it reads as a continuation of the main chrome. Enters/leaves with
 * opacity + a small slide — no scale pop (see project animation rules).
 */
function EditorStickyBar({
  visible,
  title,
  slug,
  status,
  saveState,
  busy,
  onPublishToggle,
  onDelete,
}: EditorStickyBarProps) {
  const t = useTranslations('blog-admin');
  const reduceMotion = useReducedMotion();
  const published = status === 'published';

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-x-0 top-[73px] z-30 border-b border-border bg-background/85 backdrop-blur-lg"
        >
          <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span className="truncate text-sm font-semibold text-foreground md:text-base">
                {title}
              </span>
              <span className="hidden shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground lg:inline-flex">
                <span className="select-none">/blog/</span>
                {slug}
              </span>
              <StatusBadge status={status} className="shrink-0" />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <SaveIndicator state={saveState} className="hidden sm:flex" />
              {published ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex"
                  onClick={() =>
                    window.open(`/blog/${slug}`, '_blank', 'noopener')
                  }
                >
                  <ExternalLinkIcon data-icon="inline-start" />
                  {t('actions.viewPublic')}
                </Button>
              ) : null}
              <Button
                variant={published ? 'secondary' : 'default'}
                size="sm"
                disabled={busy}
                onClick={onPublishToggle}
              >
                {published ? t('actions.unpublish') : t('actions.publish')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('list.delete')}
                disabled={busy}
                onClick={onDelete}
                className="hidden text-muted-foreground hover:text-destructive md:inline-flex"
              >
                <Trash2Icon />
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function SaveIndicator({
  state,
  className,
}: {
  state: SaveState;
  className?: string;
}) {
  const t = useTranslations('blog-admin');
  if (state === 'idle') return null;
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-xs',
        state === 'error' ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
    >
      {state === 'saving' ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : null}
      {t(`editor.save.${state}`)}
    </span>
  );
}

/**
 * Click-to-edit single-line text. Commits on blur or Enter, reverts on
 * Escape. Uncontrolled (`defaultValue`) so local typing never fights an
 * upstream re-render; the `key={value}` remount resyncs it whenever the
 * server reconciles the value (e.g. slug rollback) without effects or
 * derived state — sidestepping the set-state-in-effect / ref-in-render rules.
 */
function InlineText({
  value,
  onCommit,
  ariaLabel,
  className,
}: {
  value: string;
  onCommit: (next: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  function commit(el: HTMLInputElement) {
    const next = el.value.trim();
    if (next && next !== value) onCommit(next);
    else el.value = value;
  }

  return (
    <input
      key={value}
      type="text"
      aria-label={ariaLabel}
      defaultValue={value}
      onBlur={(e) => commit(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.currentTarget.value = value;
          e.currentTarget.blur();
        }
      }}
      className={cn(
        'min-w-0 rounded-md bg-transparent px-1 py-0.5 text-foreground outline-none transition-colors hover:bg-muted/50 focus:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    />
  );
}
