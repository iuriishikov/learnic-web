'use client';

import {
  ChevronRightIcon,
  FileTextIcon,
  RotateCwIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import {
  NoteContentError,
  useNoteContent,
} from '../api/use-note-content';
import type { PublicNoteContent, PublicModule } from '../model/public-content';
import type { Product } from '../model/types';

import { InfoSection } from './product-info-section';

/**
 * Note curriculum preview for the public product landing — the module →
 * lesson tree read from the published release (answer keys stripped), styled
 * as the editorial numbered "table of contents" («Спотлайт» layout). It's the
 * `note` entry in the per-type section registry (`product-info-sections.tsx`).
 *
 * Secondary content: a load failure is surfaced inline (retry), and a missing
 * release / non-note (`not-found`) or an empty tree drops the whole section so
 * the landing stays clean — never a page-level error.
 */
export function ProductNoteStructure({ product }: { product: Product }) {
  const t = useTranslations('marketplace.detail.structure');
  const isNote = product.type === 'note';
  const query = useNoteContent(product.id, isNote);

  if (!isNote) return null;

  // Note exists but has no published curriculum yet (or isn't a note on
  // the content endpoint) — hide the section rather than show an error box.
  if (
    query.isError &&
    query.error instanceof NoteContentError &&
    query.error.reason === 'not-found'
  ) {
    return null;
  }
  if (query.data && query.data.modules.length === 0) return null;

  return (
    <InfoSection eyebrow={t('title')}>
      {query.isPending ? (
        <StructureSkeleton />
      ) : query.isError ? (
        <StructureError
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
        />
      ) : (
        <div>
          <p className="mb-6 text-sm text-muted-foreground">
            {t('summary', {
              modules: query.data.modules.length,
              lessons: countLessons(query.data),
            })}
          </p>
          <ul className="divide-y divide-border border-y border-border">
            {query.data.modules.map((module, index) => (
              <ModuleRow key={module.id} module={module} index={index} />
            ))}
          </ul>
        </div>
      )}
    </InfoSection>
  );
}

function countLessons(content: PublicNoteContent): number {
  return content.modules.reduce((sum, m) => sum + m.lessons.length, 0);
}

function ModuleRow({
  module,
  index,
}: {
  module: PublicModule;
  index: number;
}) {
  const t = useTranslations('marketplace.detail.structure');
  const reduceMotion = useReducedMotion();
  // First module expanded by default — gives a peek at the curriculum depth
  // without overwhelming the landing.
  const [open, setOpen] = useState(index === 0);
  const hasLessons = module.lessons.length > 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t('collapse') : t('expand')}
        className="group/module flex w-full items-center gap-4 py-4 text-left"
      >
        <span className="w-10 shrink-0 text-2xl font-semibold tabular-nums text-muted-foreground/50 md:text-3xl">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1 text-base font-medium text-foreground transition-colors group-hover/module:text-brand md:text-lg">
          {module.title}
        </span>
        <span className="shrink-0 whitespace-nowrap text-sm text-muted-foreground">
          {t('moduleLessons', { count: module.lessons.length })}
        </span>
        <ChevronRightIcon
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-90',
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="lessons"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={
              reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }
            }
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.2,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{ overflow: 'hidden' }}
          >
            {hasLessons ? (
              <ul className="mb-3 ml-[1.4rem] flex flex-col border-l border-border pl-6">
                {module.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-2.5 py-2.5 text-sm"
                  >
                    <FileTextIcon
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">
                      {lesson.title}
                    </span>
                    {lesson.blocks.length > 0 ? (
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                        {t('lessonMaterials', { count: lesson.blocks.length })}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 ml-[1.4rem] border-l border-border py-2.5 pl-6 text-sm text-muted-foreground">
                {t('lessonsEmpty')}
              </p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

function StructureSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-10 shrink-0" />
            <Skeleton className="h-5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StructureError({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const t = useTranslations('marketplace.detail.structure.error');
  return (
    <div role="alert" className="rounded-xl bg-muted/40 px-4 py-5">
      <p className="text-sm font-medium text-foreground">{t('title')}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {t('description')}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-3 gap-1.5"
      >
        <RotateCwIcon className={cn('size-3.5', isRetrying && 'animate-spin')} />
        {t('retry')}
      </Button>
    </div>
  );
}
