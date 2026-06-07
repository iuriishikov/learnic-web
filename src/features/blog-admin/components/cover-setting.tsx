'use client';

import { ImagePlusIcon, Loader2Icon, Trash2Icon } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRef, useState, type ChangeEvent } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';

import { removeCoverAction, setCoverAction } from '../api/cover';
import { useBlogErrorToast } from '../lib/use-blog-errors';
import { BLOG_COVER_MAX_BYTES } from '../model/limits';
import type { BlogPost } from '../model/types';

type CoverSettingProps = {
  post: BlogPost;
  /** Receives the full updated post returned by the cover endpoints. */
  onChange: (post: BlogPost) => void;
};

export function CoverSetting({ post, onChange }: CoverSettingProps) {
  const t = useTranslations('blog-admin');
  const errorToast = useBlogErrorToast();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cover = post.cover;

  async function handlePick(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError(t('media.errors.wrongType'));
      return;
    }
    if (picked.size > BLOG_COVER_MAX_BYTES) {
      setError(t('media.errors.tooLarge'));
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.append('file', picked);
    setBusy(true);
    const result = await setCoverAction(post.id, fd);
    setBusy(false);
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    onChange(result.data);
  }

  async function handleRemove() {
    setBusy(true);
    const result = await removeCoverAction(post.id);
    setBusy(false);
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    setError(null);
    onChange(result.data);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePick}
      />

      <AnimatePresence mode="wait" initial={false}>
        {cover ? (
          <motion.div
            key="filled"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-muted ring-1 ring-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL; next/image remote loader N/A */}
            <img
              src={cover.url}
              alt={t('cover.alt')}
              className="size-full object-cover"
            />
            {/* Overlay controls — frosted so they read on any cover. */}
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="h-8 border border-border/50 bg-background/80 shadow-sm backdrop-blur-md"
              >
                {t('cover.replace')}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label={t('cover.remove')}
                disabled={busy}
                onClick={handleRemove}
                className="size-8 border border-border/50 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-md hover:text-destructive"
              >
                <Trash2Icon />
              </Button>
            </div>
            {busy ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                <Loader2Icon className="size-5 animate-spin text-foreground" />
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.button
            key="empty"
            type="button"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-5 text-sm transition-colors',
              'hover:border-brand/40 hover:bg-muted/50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
              busy && 'pointer-events-none opacity-60',
            )}
          >
            {busy ? (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlusIcon className="size-4 text-muted-foreground" />
            )}
            <span className="font-medium text-foreground">
              {busy ? t('cover.uploading') : t('cover.add')}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              · {t('cover.limit')}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
