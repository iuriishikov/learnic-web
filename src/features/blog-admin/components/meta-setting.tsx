'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

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
 * title) and the short description (under the title). Saves are debounced
 * while typing and flushed on blur.
 */
export function MetaSetting({ post, onChange }: MetaSettingProps) {
  const t = useTranslations('blog-admin');
  const errorToast = useBlogErrorToast();
  const [topic, setTopic] = useState(post.topic ?? '');
  const [subtitle, setSubtitle] = useState(post.subtitle ?? '');

  const timer = useRef<number | null>(null);
  const latest = useRef({ topic, subtitle });

  async function save() {
    const { topic: tp, subtitle: s } = latest.current;
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

  function schedule(next: { topic: string; subtitle: string }) {
    latest.current = next;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void save();
    }, SAVE_DEBOUNCE_MS);
  }

  function flush() {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
      void save();
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-4 md:p-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blog-meta-topic" className="text-sm font-medium">
          {t('meta.topicLabel')}
        </Label>
        <Input
          id="blog-meta-topic"
          value={topic}
          maxLength={BLOG_POST_TOPIC_MAX_LEN}
          placeholder={t('meta.topicPlaceholder')}
          onChange={(e) => {
            setTopic(e.target.value);
            schedule({ topic: e.target.value, subtitle });
          }}
          onBlur={flush}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="blog-meta-subtitle" className="text-sm font-medium">
          {t('meta.descriptionLabel')}
        </Label>
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
          onBlur={flush}
          className="resize-none"
        />
      </div>
    </section>
  );
}
