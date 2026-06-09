'use client';

import { CalendarIcon, ClockIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Fragment } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  softAccentFromSeed,
  type SoftAccent,
} from '@/shared/lib/placeholder-accent';
import { Placeholder } from '@/shared/ui/placeholder';

import { descriptionExcerpt } from '../lib/description-html';

export type ProductShowcaseType = 'note' | 'podcast';

/** Re-export of the shared soft accent palette for ergonomic consumption from products. */
export type ProductShowcaseAccent = SoftAccent;

/** Stable accent per id — same id always maps to the same accent across renders. */
export const accentFromId = softAccentFromSeed;

export type ProductShowcaseTag = {
  id: string;
  name: string;
  color: string;
};

type ProductShowcaseCardProps = {
  type: ProductShowcaseType;
  typeLabel: string;
  title: string;
  /**
   * Product description as stored by the backend — sanitized HTML (or
   * legacy plain text). The card derives a tag-stripped plain-text
   * excerpt itself and clamps it to two lines; empty / whitespace-only
   * values collapse the row entirely. Consumers pass the raw value.
   */
  description?: string | null;
  /**
   * Completion-time label (e.g. "2 ч"). Omit or pass `null`/empty when the
   * duration is unset — the stat is hidden entirely rather than rendering a
   * dash placeholder.
   */
  durationLabel?: string | null;
  dueLabel?: string | null;
  accent?: ProductShowcaseAccent;
  coverUrl?: string | null;
  tags?: ProductShowcaseTag[];
  className?: string;
  onClick?: () => void;
};

const TYPE_PILL: Record<ProductShowcaseType, string> = {
  note: 'bg-violet-200 text-violet-950',
  podcast: 'bg-emerald-200 text-emerald-950',
};

/**
 * Chip row cap — cards in a grid must stay rhythmically even, so
 * overflow collapses into a "+N" counter instead of wrapping into a
 * third row of chips. Hidden names surface via the counter's `title`.
 */
const MAX_VISIBLE_TAGS = 3;

export function ProductShowcaseCard({
  type,
  typeLabel,
  title,
  description,
  durationLabel,
  dueLabel,
  accent = 'pink',
  coverUrl,
  tags,
  className,
  onClick,
}: ProductShowcaseCardProps) {
  const reduceMotion = useReducedMotion();
  const interactive = typeof onClick === 'function';
  const lead = descriptionExcerpt(description);
  const visibleTags = tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const overflowTags = tags?.slice(MAX_VISIBLE_TAGS) ?? [];

  // Stat chips render only when they have a value — an unset duration is
  // dropped entirely (no "—" placeholder), and the bullet separator only
  // appears between two present stats. When neither stats nor tags exist
  // the whole meta zone (incl. its divider) collapses.
  const stats: { key: string; icon: React.ReactNode; label: string }[] = [];
  if (durationLabel) {
    stats.push({ key: 'duration', icon: <ClockIcon />, label: durationLabel });
  }
  if (dueLabel) {
    stats.push({ key: 'due', icon: <CalendarIcon />, label: dueLabel });
  }
  const hasMeta = stats.length > 0 || visibleTags.length > 0;

  return (
    <motion.article
      {...(interactive
        ? {
            role: 'button',
            tabIndex: 0,
            onClick,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick?.();
              }
            },
          }
        : {})}
      aria-label={title}
      whileHover={reduceMotion || !interactive ? undefined : { y: -3 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className={cn(
        'group/showcase relative flex h-full w-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-md shadow-black/[0.06] ring-1 ring-foreground/10 transition-shadow dark:shadow-black/30',
        interactive &&
          'cursor-pointer hover:ring-foreground/15 hover:shadow-lg dark:hover:shadow-black/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <div className="px-[3px] pt-[3px]">
        <div className="relative h-40 w-full overflow-hidden rounded-t-[9px]">
          {/*
            Hover feedback only (scale is reserved for hover/press):
            the cover zooms gently inside its clipped frame while the
            card itself lifts. Disabled for reduced-motion users.
          */}
          <div
            className={cn(
              'absolute inset-0 transition-transform duration-300 ease-out',
              interactive &&
                !reduceMotion &&
                'group-hover/showcase:scale-[1.04]',
            )}
          >
            {coverUrl ? (
              <div
                role="img"
                aria-label={title}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${coverUrl})` }}
              />
            ) : (
              <Placeholder variant="soft" seed={title} accent={accent} />
            )}
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-3 p-4 pt-0">
        <span
          className={cn(
            'inline-flex h-6 w-fit -translate-y-1/2 items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] ring-[3px] ring-card',
            TYPE_PILL[type],
          )}
        >
          {typeLabel}
        </span>
        <div className="space-y-1.5">
          <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
            {title}
          </h3>
          {lead ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {lead}
            </p>
          ) : null}
        </div>

        {hasMeta ? (
          <div className="mt-auto flex flex-col gap-2.5 border-t border-border/60 pt-3">
            {stats.length > 0 ? (
              <dl className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                {stats.map((stat, index) => (
                  <Fragment key={stat.key}>
                    {index > 0 ? (
                      <span
                        aria-hidden
                        className="size-1 rounded-full bg-muted-foreground/40"
                      />
                    ) : null}
                    <Stat icon={stat.icon} label={stat.label} />
                  </Fragment>
                ))}
              </dl>
            ) : null}
            {visibleTags.length > 0 ? (
              // Tags always live on their own row below the stats — never
              // sharing a line with duration/due — and are capped at
              // MAX_VISIBLE_TAGS so card heights stay even across the
              // grid; the rest collapse into a "+N" counter chip.
              <ul className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <li
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="max-w-[10rem] truncate">{tag.name}</span>
                  </li>
                ))}
                {overflowTags.length > 0 ? (
                  <li
                    title={overflowTags.map((tag) => tag.name).join(', ')}
                    className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    +{overflowTags.length}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="[&>svg]:size-3.5">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
