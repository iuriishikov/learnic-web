'use client';

import { ArrowUpRightIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { Placeholder } from '@/shared/ui/placeholder';
import { UserAvatar } from '@/shared/ui/user-avatar';

import type { FeaturedPostData } from '../model/types';

type FeaturedPostProps = {
  post: FeaturedPostData;
  /** Label for the brand call-to-action (e.g. "Читать статью"). */
  readLabel: string;
};

/**
 * The blog index lead story: a two-column editorial hero — wide
 * square-cornered cover beside the topic eyebrow, title, excerpt, author
 * byline, and a brand CTA. Stacks to a single column on mobile. The whole
 * block is one link; hover lifts the cover and tints the title.
 */
export function FeaturedPost({ post, readLabel }: FeaturedPostProps) {
  const reduceMotion = useReducedMotion();
  const format = useFormatter();
  const date = post.publishedAt
    ? format.dateTime(new Date(post.publishedAt), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group/featured grid grid-cols-1 gap-6 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background lg:grid-cols-2 lg:items-center lg:gap-10"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL; next/image remote loader N/A
            <img
              src={post.coverUrl}
              alt=""
              className="size-full object-cover transition-transform duration-500 ease-out group-hover/featured:scale-[1.02]"
            />
          ) : (
            <Placeholder
              variant="brand"
              seed={post.slug}
              sizes="(min-width: 1024px) 600px, 100vw"
              className="transition-transform duration-500 ease-out group-hover/featured:scale-[1.02]"
            />
          )}
        </div>

        <div className="flex flex-col gap-4">
          {post.topic ? (
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {post.topic}
            </span>
          ) : null}

          <h2 className="text-pretty font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover/featured:text-brand md:text-3xl lg:text-4xl">
            {post.title}
          </h2>

          {post.excerpt ? (
            <p className="line-clamp-3 text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              {post.excerpt}
            </p>
          ) : null}

          {post.author || date ? (
            <div className="mt-1 flex items-center gap-2.5">
              {post.author ? (
                <UserAvatar
                  user={{
                    id: post.author.name,
                    fullName: post.author.name,
                    avatar: null,
                  }}
                  imageUrl={post.author.avatarUrl}
                  showStatus={false}
                  shape="circle"
                  size="default"
                />
              ) : null}
              <div className="flex flex-col">
                {post.author ? (
                  <span className="text-sm font-semibold text-foreground">
                    {post.author.name}
                  </span>
                ) : null}
                {date ? (
                  <span className="text-sm text-muted-foreground">{date}</span>
                ) : null}
              </div>
            </div>
          ) : null}

          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            {readLabel}
            <ArrowUpRightIcon
              aria-hidden
              className="size-3.5 transition-transform duration-300 group-hover/featured:-translate-y-0.5 group-hover/featured:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
