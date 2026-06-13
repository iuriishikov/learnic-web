'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PanelLeftIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Image } from '@/shared/ui/image';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';

import type { PublicSchemeLesson, PublicSchemeModule } from '../model/public-scheme';

import { LessonBlockViewer } from './lesson-block-viewers';
import {
  DEMO_INITIAL_LESSON_ID,
  DEMO_LESSON_BLOCKS,
  DEMO_PRODUCT,
  DEMO_SCHEME,
} from './note-reader-demo-data';
import { ProductReaderNav } from './product-reader-nav';

const EASE = [0.32, 0.72, 0, 1] as const;

type FlatLesson = {
  lesson: PublicSchemeLesson;
  module: PublicSchemeModule;
};

const FLAT_LESSONS: FlatLesson[] = DEMO_SCHEME.modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ lesson, module })),
);

/**
 * Landing-hero showcase of the in-product note reader, rendered fully offline
 * from {@link DEMO_SCHEME} + {@link DEMO_LESSON_BLOCKS}. It reuses the exact
 * production chrome — {@link ProductReaderNav} for the curriculum sidebar and
 * {@link LessonBlockViewer} for every block — so a screenshot of this surface
 * is a faithful capture of what an enrolled learner sees, with no backend,
 * enrollment or network round-trip in the way. Answer blocks render in their
 * answerable (`canAnswer`) state; nothing here submits to the server.
 */
export function NoteReaderDemoView() {
  const t = useTranslations('product-reader');
  const reduceMotion = useReducedMotion();

  const [selectedLessonId, setSelectedLessonId] = useState(
    DEMO_INITIAL_LESSON_ID,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectedIndex = useMemo(
    () => FLAT_LESSONS.findIndex((f) => f.lesson.id === selectedLessonId),
    [selectedLessonId],
  );
  const current = selectedIndex >= 0 ? FLAT_LESSONS[selectedIndex] : null;
  const blocks = DEMO_LESSON_BLOCKS[selectedLessonId] ?? [];

  const moduleCount = DEMO_SCHEME.modules.length;
  const lessonCount = FLAT_LESSONS.length;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < lessonCount - 1;

  const selectLesson = useCallback(
    (lessonId: string) => {
      setSelectedLessonId(lessonId);
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    },
    [reduceMotion],
  );

  const goTo = useCallback(
    (index: number) => {
      const target = FLAT_LESSONS[index];
      if (target) selectLesson(target.lesson.id);
    },
    [selectLesson],
  );

  const onSelectFromNav = useCallback(
    (lessonId: string) => {
      selectLesson(lessonId);
      setMobileNavOpen(false);
    },
    [selectLesson],
  );

  const nav = (
    <ProductReaderNav
      modules={DEMO_SCHEME.modules}
      selectedLessonId={current?.lesson.id ?? null}
      selectedModuleId={current?.module.id ?? null}
      onSelectLesson={onSelectFromNav}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-8 pb-16 md:px-6 md:pt-10 lg:px-8">
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar (desktop only) */}
        <aside className="hidden self-start lg:sticky lg:top-8 lg:block">
          <ScrollArea className="max-h-[calc(100vh-4rem)]">
            <div className="flex flex-col gap-4 px-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <Image
                  src={DEMO_PRODUCT.cover?.url ?? ''}
                  alt={DEMO_PRODUCT.title}
                  fill
                  sizes="280px"
                  unoptimized
                  priority
                />
              </div>

              <div className="flex flex-col gap-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {DEMO_PRODUCT.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('nav.summary', {
                    modules: moduleCount,
                    lessons: lessonCount,
                  })}
                </p>
              </div>

              <Separator />

              {nav}
            </div>
          </ScrollArea>
        </aside>

        {/* Main reading column */}
        <div className="min-w-0">
          {/* Mobile/tablet control row */}
          <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" size="sm">
                    <PanelLeftIcon />
                    {t('nav.title')}
                  </Button>
                }
              />
              <SheetContent
                side="left"
                className="flex w-[88vw] flex-col gap-0 sm:max-w-md"
              >
                <SheetHeader className="border-b border-border">
                  <SheetTitle>{t('nav.title')}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {t('nav.summary', {
                      modules: moduleCount,
                      lessons: lessonCount,
                    })}
                  </SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
                  {nav}
                </div>
              </SheetContent>
            </Sheet>
            {current ? (
              <p className="text-sm text-muted-foreground">
                {t('lesson.position', {
                  current: selectedIndex + 1,
                  total: lessonCount,
                })}
              </p>
            ) : null}
          </div>

          <div className="max-w-[820px]">
            {current ? (
              <motion.article
                key={current.lesson.id}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <header className="border-b border-border pb-5 md:pb-6">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {current.module.title}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {current.lesson.title}
                  </h1>
                </header>

                <div className="mt-8 space-y-8">
                  {blocks.map((block) => (
                    <LessonBlockViewer
                      key={block.id}
                      block={block}
                      ctx={{
                        noteId: DEMO_PRODUCT.id,
                        canAnswer: true,
                        savedAnswer: null,
                      }}
                    />
                  ))}
                </div>
              </motion.article>
            ) : null}

            {current ? (
              <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-5 md:mt-12">
                {hasPrev ? (
                  <Button
                    variant="ghost"
                    onClick={() => goTo(selectedIndex - 1)}
                    aria-label={t('lesson.prevLabel')}
                  >
                    <ArrowLeftIcon />
                    {t('lesson.prev')}
                  </Button>
                ) : (
                  <span aria-hidden className="invisible">
                    <Button variant="ghost" tabIndex={-1}>
                      <ArrowLeftIcon />
                      {t('lesson.prev')}
                    </Button>
                  </span>
                )}

                <p className="hidden text-sm text-muted-foreground md:block">
                  {t('lesson.position', {
                    current: selectedIndex + 1,
                    total: lessonCount,
                  })}
                </p>

                {hasNext ? (
                  <Button
                    variant="outline"
                    onClick={() => goTo(selectedIndex + 1)}
                    aria-label={t('lesson.nextLabel')}
                  >
                    {t('lesson.next')}
                    <ArrowRightIcon />
                  </Button>
                ) : (
                  <span aria-hidden className="invisible">
                    <Button variant="outline" tabIndex={-1}>
                      {t('lesson.next')}
                      <ArrowRightIcon />
                    </Button>
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
