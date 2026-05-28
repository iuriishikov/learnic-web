'use client';

import { ArrowUpRightIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
import { Placeholder } from '@/shared/ui/placeholder';

export type BlogPostCardProps = {
  /** Bold heading shown under the cover. */
  title: string;
  /** Supporting paragraph under the title. */
  description: string;
  /** Author name, shown in the cover meta band. */
  author: string;
  /** Pre-formatted publish date, shown next to the author. */
  date: string;
  /** Category label, shown right-aligned in the meta band. */
  category: string;
  /** Where the card links to. Defaults to `#`. */
  href?: string;
  /** Label for the brand call-to-action. Defaults to "Read post". */
  readLabel?: string;
  /** Seed used to pick a deterministic brand cover. */
  imageSeed?: string;
  /** Optional entry-animation stagger index (used inside grids). */
  index?: number;
  className?: string;
};

export function BlogPostCard({
  title,
  description,
  author,
  date,
  category,
  href = '#',
  readLabel = 'Read post',
  imageSeed,
  index = 0,
  className,
}: BlogPostCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
      className={cn('h-full', className)}
    >
      <a
        href={href}
        className="group/post flex h-full flex-col rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {/* Cover with frosted meta band */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          <Placeholder
            variant="brand"
            seed={imageSeed ?? title}
            sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"
            className="transition-transform duration-500 ease-out group-hover/post:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 border-t border-white/20 bg-background/35 px-4 py-3 text-white backdrop-blur-lg">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-semibold">{author}</span>
              <span className="truncate text-xs text-white/80">{date}</span>
            </div>
            <span className="shrink-0 text-xs font-semibold">{category}</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col pt-4">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover/post:text-brand">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {/* Pinned to the bottom so the CTA lines up across cards of unequal height. */}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand">
            {readLabel}
            <ArrowUpRightIcon
              aria-hidden
              className="size-3.5 transition-transform duration-300 group-hover/post:translate-x-0.5 group-hover/post:-translate-y-0.5"
            />
          </span>
        </div>
      </a>
    </motion.article>
  );
}
