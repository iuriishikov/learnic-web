'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  avatarHaloClasses,
} from '@/shared/ui/avatar';

import type { UserExperience } from '../model/types';

type ExperienceCardProps = {
  experience: UserExperience;
  className?: string;
};

export function ExperienceCard({ experience, className }: ExperienceCardProps) {
  const t = useTranslations('user-experiences.card');
  const formatter = useFormatter();

  const start = formatter.dateTime(parseCalendarDate(experience.startDate), {
    year: 'numeric',
    month: 'short',
  });
  const end = experience.endDate
    ? formatter.dateTime(parseCalendarDate(experience.endDate), {
        year: 'numeric',
        month: 'short',
      })
    : t('present');
  const period = `${start} – ${end}`;

  const fallbackInitial =
    experience.title.trim().charAt(0).toUpperCase() || '?';

  return (
    <article
      className={cn(
        'flex flex-col rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-[0_2px_6px_-1px_rgb(0_0_0/0.06),0_1px_2px_-1px_rgb(0_0_0/0.04)]',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start gap-4">
          <Avatar className={cn('size-12 shrink-0', avatarHaloClasses)}>
            {experience.icon ? (
              <AvatarImage src={experience.icon.url} alt="" />
            ) : null}
            <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">
              {fallbackInitial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base font-semibold leading-snug text-foreground">
              {experience.title}
            </h3>
            {experience.description ? (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                {experience.description}
              </p>
            ) : null}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{period}</p>
      </div>
      {experience.sourceUrl ? (
        <div className="flex justify-end border-t border-border px-5 py-4">
          <a
            href={experience.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="link text-sm font-semibold focus-visible:outline-none"
          >
            {t('viewSource')}
          </a>
        </div>
      ) : null}
    </article>
  );
}

/**
 * Parse a `YYYY-MM-DD` calendar string into a `Date` anchored to UTC.
 *
 * `new Date('2018-01-01')` parses as UTC midnight, which can shift
 * a day when the user's timezone has a negative offset. Constructing
 * via `Date.UTC` keeps month/year stable across locales — month-only
 * formatting is the only consumer here so we don't care about the
 * intra-day component.
 */
function parseCalendarDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}
