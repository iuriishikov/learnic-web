'use client';

import {
  EllipsisVerticalIcon,
  GripVerticalIcon,
  StarIcon,
  UsersIcon,
  WalletIcon,
  ZapIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

const STATS: { key: 'students' | 'completion' | 'revenue' | 'rating'; icon: LucideIcon }[] = [
  { key: 'students', icon: UsersIcon },
  { key: 'completion', icon: ZapIcon },
  { key: 'revenue', icon: WalletIcon },
  { key: 'rating', icon: StarIcon },
];

const LESSONS: { key: 'lesson1' | 'lesson2' | 'lesson3' | 'lesson4'; draft?: boolean }[] = [
  { key: 'lesson1' },
  { key: 'lesson2' },
  { key: 'lesson3' },
  { key: 'lesson4', draft: true },
];

export function TeachPageContent() {
  const t = useTranslations('test-studio-mode.teach.page');

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {t('subtitle')}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4 md:gap-4">
        {STATS.map(({ key, icon: Icon }) => (
          <div
            key={key}
            className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 shadow-xs md:p-5"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon className="size-4" aria-hidden />
              <span>{t(`stats.${key}.label`)}</span>
            </div>
            <p className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              {t(`stats.${key}.value`)}
            </p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-base font-semibold text-foreground md:text-lg">
        {t('lessonsTitle')}
      </h2>
      <ul className="mt-4 flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-xs">
        {LESSONS.map((lesson, index) => (
          <li
            key={lesson.key}
            className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-muted/60 md:px-3"
          >
            <GripVerticalIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground"
            />
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {t(`lessons.${lesson.key}.title`)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {t(`lessons.${lesson.key}.meta`)}
              </p>
            </div>
            {lesson.draft ? (
              <span className="hidden rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground md:inline-flex">
                draft
              </span>
            ) : null}
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Действия"
            >
              <EllipsisVerticalIcon className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
