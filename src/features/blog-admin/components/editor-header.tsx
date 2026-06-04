'use client';

import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import type { BlogPostStatus } from '../model/types';
import { StatusBadge } from './status-badge';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

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
}: EditorHeaderProps) {
  const t = useTranslations('blog-admin');
  const published = status === 'published';

  return (
    <header className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-lg md:-mx-6 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          {t('editor.back')}
        </Link>
        <div className="flex items-center gap-2">
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
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations('blog-admin');
  if (state === 'idle') return null;
  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-xs',
        state === 'error' ? 'text-destructive' : 'text-muted-foreground',
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
