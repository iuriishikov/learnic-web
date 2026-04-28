'use client';

import { PlayIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/button';

const CARDS = [
  { key: 'react', progress: 64 },
  { key: 'design', progress: 22 },
  { key: 'english', progress: 81 },
] as const;

export function LearnPageContent() {
  const t = useTranslations('test-studio-mode.learn.page');

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {t('greeting')}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
        {t('subtitle')}
      </p>

      <h2 className="mt-10 text-base font-semibold text-foreground md:text-lg">
        {t('courseCardsTitle')}
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <article
            key={card.key}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs"
          >
            <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-brand/15 via-brand/5 to-muted" />
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {t(`cards.${card.key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`cards.${card.key}.teacher`)}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{t(`cards.${card.key}.progress`)}</span>
                <span>{card.progress}%</span>
              </div>
              <div
                aria-hidden
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-auto h-10 w-full justify-center gap-2 rounded-lg text-sm font-semibold"
            >
              <PlayIcon className="size-4" />
              {t('continueLabel')}
            </Button>
          </article>
        ))}
      </div>
    </main>
  );
}
