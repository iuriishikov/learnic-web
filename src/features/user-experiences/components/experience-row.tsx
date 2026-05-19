'use client';

import { ExternalLinkIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  avatarHaloClasses,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';

import type { UserExperience } from '../model/types';

type ExperienceRowProps = {
  experience: UserExperience;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
};

/**
 * Compact one-line representation of an experience used inside the
 * settings list. Public profile uses the bigger `ExperienceCard`; this
 * row prioritises horizontal density and surfaces Edit / Delete affordances
 * for the owner.
 */
export function ExperienceRow({
  experience,
  onEdit,
  onDelete,
  className,
}: ExperienceRowProps) {
  const t = useTranslations('settings.experience.row');
  const tCard = useTranslations('user-experiences.card');
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
    : tCard('present');
  const period = `${start} – ${end}`;

  const fallbackInitial =
    experience.title.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start',
        className,
      )}
    >
      <Avatar className={cn('size-12 shrink-0', avatarHaloClasses)}>
        {experience.icon ? (
          <AvatarImage src={experience.icon.url} alt="" />
        ) : null}
        <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">
          {fallbackInitial}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-col">
          <h3 className="font-heading text-sm font-semibold leading-snug text-foreground">
            {experience.title}
          </h3>
          {experience.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {experience.description}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{period}</p>
        {experience.sourceUrl ? (
          <a
            href={experience.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="link inline-flex w-fit items-center gap-1 text-xs font-medium"
          >
            {tCard('viewSource')}
            <ExternalLinkIcon className="size-3" aria-hidden />
          </a>
        ) : null}
      </div>
      <div className="flex items-center gap-1 self-start">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={t('edit')}
        >
          <PencilIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          aria-label={t('delete')}
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}

function parseCalendarDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}
