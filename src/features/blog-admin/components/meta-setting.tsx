'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useDebouncedFlush } from '@/shared/hooks/use-debounced-flush';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { editPostMetaAction } from '../api/meta';
import { useBlogErrorToast } from '../lib/use-blog-errors';
import {
  BLOG_POST_SUBTITLE_MAX_LEN,
  BLOG_POST_TOPIC_MAX_LEN,
} from '../model/limits';
import type { BlogPost } from '../model/types';

const SAVE_DEBOUNCE_MS = 700;

type MetaSettingProps = {
  post: BlogPost;
  /** Receives the full updated post returned by the meta endpoint. */
  onChange: (post: BlogPost) => void;
};

/**
 * Edits the post's public metadata — the topic (category label above the
 * title) and the short description (under the title). Standard labeled
 * fields with a remaining-characters hint in the label row while a field
 * is focused near its limit. Saves are debounced while typing and
 * flushed on blur.
 */
export function MetaSetting({ post, onChange }: MetaSettingProps) {
  const t = useTranslations('blog-admin');
  const errorToast = useBlogErrorToast();
  const [topic, setTopic] = useState(post.topic ?? '');
  const [subtitle, setSubtitle] = useState(post.subtitle ?? '');
  const [focused, setFocused] = useState<'topic' | 'subtitle' | null>(null);

  // Both fields are batched into one debounced meta save; blur flushes the
  // pending write so leaving the field commits immediately.
  const { schedule, flush } = useDebouncedFlush<{
    topic: string;
    subtitle: string;
  }>({
    serverValue: { topic: post.topic ?? '', subtitle: post.subtitle ?? '' },
    onChange: (value) => {
      void save(value);
    },
    delayMs: SAVE_DEBOUNCE_MS,
    equals: (a, b) => a.topic === b.topic && a.subtitle === b.subtitle,
  });

  async function save({ topic: tp, subtitle: s }: { topic: string; subtitle: string }) {
    const result = await editPostMetaAction(post.id, {
      topic: tp.trim() ? tp : null,
      subtitle: s.trim() ? s : null,
    });
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    onChange(result.data);
  }

  return (
    <section className="flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="blog-meta-topic" className="text-sm font-medium">
            {t('meta.topicLabel')}
          </Label>
          <LimitCounter
            length={topic.length}
            max={BLOG_POST_TOPIC_MAX_LEN}
            visible={focused === 'topic'}
          />
        </div>
        <Input
          id="blog-meta-topic"
          value={topic}
          maxLength={BLOG_POST_TOPIC_MAX_LEN}
          placeholder={t('meta.topicPlaceholder')}
          onChange={(e) => {
            setTopic(e.target.value);
            schedule({ topic: e.target.value, subtitle });
          }}
          onFocus={() => setFocused('topic')}
          onBlur={() => {
            setFocused(null);
            flush();
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="blog-meta-subtitle" className="text-sm font-medium">
            {t('meta.descriptionLabel')}
          </Label>
          <LimitCounter
            length={subtitle.length}
            max={BLOG_POST_SUBTITLE_MAX_LEN}
            visible={focused === 'subtitle'}
          />
        </div>
        <Textarea
          id="blog-meta-subtitle"
          value={subtitle}
          maxLength={BLOG_POST_SUBTITLE_MAX_LEN}
          rows={2}
          placeholder={t('meta.descriptionPlaceholder')}
          onChange={(e) => {
            setSubtitle(e.target.value);
            schedule({ topic, subtitle: e.target.value });
          }}
          onFocus={() => setFocused('subtitle')}
          onBlur={() => {
            setFocused(null);
            flush();
          }}
          // Short deck field — clamp the auto-grow start to ~3 lines
          // instead of the base `min-h-32`.
          className="min-h-20"
        />
      </div>
    </section>
  );
}

/**
 * Remaining-characters hint shown while a field is focused and within the
 * last 20% of its limit. Lives in the label row (right-aligned), fades
 * with opacity only (no scale pop).
 */
function LimitCounter({
  length,
  max,
  visible,
}: {
  length: number;
  max: number;
  visible: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const remaining = max - length;
  const show = visible && remaining <= Math.ceil(max * 0.2);

  return (
    <AnimatePresence>
      {show ? (
        <motion.span
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          aria-hidden
          className={cn(
            'pointer-events-none text-xs tabular-nums',
            remaining <= 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {remaining}
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}
