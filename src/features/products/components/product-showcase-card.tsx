'use client';

import { CalendarIcon, ClockIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/shared/lib/utils';
import {
  softAccentFromSeed,
  type SoftAccent,
} from '@/shared/lib/placeholder-accent';
import { Placeholder } from '@/shared/ui/placeholder';

export type ProductShowcaseType = 'course' | 'webinar' | 'podcast';

/** Re-export of the shared soft accent palette for ergonomic consumption from products. */
export type ProductShowcaseAccent = SoftAccent;

/** Stable accent per id — same id always maps to the same accent across renders. */
export const accentFromId = softAccentFromSeed;

type ProductShowcaseCardProps = {
  type: ProductShowcaseType;
  typeLabel: string;
  title: string;
  durationLabel: string;
  dueLabel?: string | null;
  accent?: ProductShowcaseAccent;
  className?: string;
  onClick?: () => void;
};

const TYPE_PILL: Record<ProductShowcaseType, string> = {
  course: 'bg-violet-200 text-violet-950',
  webinar: 'bg-rose-200 text-rose-950',
  podcast: 'bg-emerald-200 text-emerald-950',
};

export function ProductShowcaseCard({
  type,
  typeLabel,
  title,
  durationLabel,
  dueLabel,
  accent = 'pink',
  className,
  onClick,
}: ProductShowcaseCardProps) {
  const reduceMotion = useReducedMotion();
  const interactive = typeof onClick === 'function';

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
        'group/showcase relative flex w-full flex-col overflow-hidden rounded-xl bg-card text-card-foreground shadow-md shadow-black/[0.06] ring-1 ring-foreground/10 transition-shadow dark:shadow-black/30',
        interactive &&
          'cursor-pointer hover:ring-foreground/15 hover:shadow-lg dark:hover:shadow-black/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <div className="px-[3px] pt-[3px]">
        <div className="relative h-40 w-full overflow-hidden rounded-t-[9px]">
          <Placeholder variant="soft" seed={title} accent={accent} />
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
        <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-3">
          {title}
        </h3>

        <dl className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Stat icon={<ClockIcon />} label={durationLabel} />
          {dueLabel ? (
            <>
              <span
                aria-hidden
                className="size-1 rounded-full bg-muted-foreground/40"
              />
              <Stat icon={<CalendarIcon />} label={dueLabel} />
            </>
          ) : null}
        </dl>
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
