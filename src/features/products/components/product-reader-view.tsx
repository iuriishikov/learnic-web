'use client';

import { ArrowLeftIcon, ArrowRightIcon, PanelLeftIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { CoverImage } from '@/shared/ui/cover-image';
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

import {
  noteLessonKey,
  noteLessonQueryOptions,
  useNoteLesson,
} from '../api/use-note-lesson';
import { noteSchemeKey, useNoteScheme } from '../api/use-note-scheme';
import { myBlockAnswersKey, useMySavedAnswers } from '../api/use-saved-answers';
import type { PublicLesson } from '../model/public-content';
import type {
  PublicNoteScheme,
  PublicSchemeLesson,
  PublicSchemeModule,
} from '../model/public-scheme';
import type { SavedBlockAnswer } from '../model/saved-answer';
import type { Product } from '../model/types';

import { LessonBlockViewer } from './lesson-block-viewers';
import { ProductReaderGuestBanner } from './product-reader-guest-banner';
import { ProductReaderNav } from './product-reader-nav';
import { ProductReaderActionsMenu } from './product-reader-actions-menu';
import {
  LessonBlocksSkeleton,
  ProductReaderSkeleton,
} from './product-reader-skeleton';

export type ReaderViewer =
  | { kind: 'enrolled'; enrollmentId: string }
  | { kind: 'guest'; loggedIn: boolean };

type ProductReaderViewProps = {
  product: Product;
  viewer: ReaderViewer;
  initialScheme: PublicNoteScheme | null;
  /** Server-fetched blocks of the opening lesson, if it has any. */
  initialLesson: PublicLesson | null;
  /** Id of the lesson the server resolved as the opening one, if any. */
  initialLessonId: string | null;
  /** Enrolled viewer's saved answers, used to restore selections + verdicts. */
  initialSavedAnswers: SavedBlockAnswer[];
};

const LESSON_PARAM = 'lesson';
const EASE = [0.32, 0.72, 0, 1] as const;

type FlatLesson = {
  lesson: PublicSchemeLesson;
  module: PublicSchemeModule;
};

function flattenLessons(scheme: PublicNoteScheme | undefined): FlatLesson[] {
  if (!scheme) return [];
  const flat: FlatLesson[] = [];
  for (const mod of scheme.modules) {
    for (const lesson of mod.lessons) {
      flat.push({ lesson, module: mod });
    }
  }
  return flat;
}

export function ProductReaderView({
  product,
  viewer,
  initialScheme,
  initialLesson,
  initialLessonId,
  initialSavedAnswers,
}: ProductReaderViewProps) {
  const queryClient = useQueryClient();
  // Seed the TanStack Query cache from the server-rendered scheme, opening
  // lesson and saved answers before the first client paint, so it matches the
  // SSR HTML, we don't refetch, and restored selections appear without a flash.
  useState(() => {
    if (initialScheme) {
      queryClient.setQueryData(noteSchemeKey(product.id), initialScheme);
    }
    if (initialLesson && initialLessonId) {
      queryClient.setQueryData(
        noteLessonKey(product.id, initialLessonId),
        initialLesson,
      );
    }
    queryClient.setQueryData(myBlockAnswersKey(product.id), initialSavedAnswers);
    return null;
  });
  // …and RE-seed whenever the server hands down new data — e.g. after a
  // guest enrolls and `router.refresh()` re-runs the RSC page: the enrolled
  // viewer reads their *pinned* release, which can differ from the anonymous
  // latest-published tree already sitting in the still-fresh cache.
  useEffect(() => {
    if (initialScheme) {
      queryClient.setQueryData(noteSchemeKey(product.id), initialScheme);
    }
    if (initialLesson && initialLessonId) {
      queryClient.setQueryData(
        noteLessonKey(product.id, initialLessonId),
        initialLesson,
      );
    }
    queryClient.setQueryData(myBlockAnswersKey(product.id), initialSavedAnswers);
  }, [
    initialScheme,
    initialLesson,
    initialLessonId,
    initialSavedAnswers,
    product.id,
    queryClient,
  ]);

  const { data, isPending, isError, refetch } = useNoteScheme(product.id);

  if (isPending && !data) {
    return <ProductReaderSkeleton />;
  }

  if (isError && !data) {
    return <ReaderError onRetry={() => void refetch()} />;
  }

  if (!data) {
    return <ProductReaderSkeleton />;
  }

  return <ReaderContent product={product} viewer={viewer} scheme={data} />;
}

function ReaderContent({
  product,
  viewer,
  scheme,
}: {
  product: Product;
  viewer: ReaderViewer;
  scheme: PublicNoteScheme;
}) {
  const t = useTranslations('product-reader');
  const reduceMotion = useReducedMotion();
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();

  const flat = useMemo(() => flattenLessons(scheme), [scheme]);

  // Saved answers for the enrolled viewer (empty for guests). Keyed by block
  // id so each interactive block can restore its prior selection + verdict.
  const { data: savedAnswers } = useMySavedAnswers(
    product.id,
    viewer.kind === 'enrolled',
  );
  const savedAnswerMap = useMemo(
    () => new Map((savedAnswers ?? []).map((a) => [a.blockId, a] as const)),
    [savedAnswers],
  );

  // The selected lesson comes from the `lesson` URL param, validated against
  // the flat ordered list. An invalid or absent param falls back to the first
  // lesson. Derived — no effect, no flicker.
  const requestedLessonId = searchParams.get(LESSON_PARAM);
  const selectedIndex = useMemo(() => {
    if (flat.length === 0) return -1;
    const found = flat.findIndex((f) => f.lesson.id === requestedLessonId);
    return found >= 0 ? found : 0;
  }, [flat, requestedLessonId]);

  const current = selectedIndex >= 0 ? flat[selectedIndex] : null;

  // Warm the next lesson's blocks as soon as a lesson is selected, so the
  // «Дальше» click paints instantly instead of dropping to the skeleton.
  // Empty lessons need no payload; `staleTime` keeps this from re-firing.
  useEffect(() => {
    const next = selectedIndex >= 0 ? flat[selectedIndex + 1] : undefined;
    if (!next || next.lesson.blockCount === 0) return;
    void queryClient.prefetchQuery(
      noteLessonQueryOptions(product.id, next.lesson.id),
    );
  }, [flat, product.id, queryClient, selectedIndex]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectLesson = useCallback(
    (lessonId: string) => {
      // Shallow update: a router.replace would re-run the whole RSC
      // page (product + enrollments + scheme + lesson seed) on every
      // click, duplicating the client-side lesson fetch. The native
      // History API integrates with useSearchParams without a server
      // round-trip; the ?lesson= param still seeds direct loads.
      const url = new URL(window.location.href);
      url.searchParams.set(LESSON_PARAM, lessonId);
      window.history.replaceState(null, '', url);
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    },
    [reduceMotion],
  );

  const goTo = useCallback(
    (index: number) => {
      const target = flat[index];
      if (target) selectLesson(target.lesson.id);
    },
    [flat, selectLesson],
  );

  const onSelectFromNav = useCallback(
    (lessonId: string) => {
      selectLesson(lessonId);
      setMobileNavOpen(false);
    },
    [selectLesson],
  );

  const isGuest = viewer.kind === 'guest';
  const canAnswer = viewer.kind === 'enrolled';
  // Anonymous visitors get the floating `SiteHeader` card (taller, with a top
  // gap); signed-in ones get the flush solid app header. Enrolled viewers are
  // always signed in. The reader needs extra top clearance — and a lower
  // sticky-sidebar offset — only under the floating card.
  const loggedIn = viewer.kind === 'enrolled' || viewer.loggedIn;

  const moduleCount = scheme.modules.length;
  const lessonCount = flat.length;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < flat.length - 1;

  const nav = (
    <ProductReaderNav
      modules={scheme.modules}
      selectedLessonId={current?.lesson.id ?? null}
      selectedModuleId={current?.module.id ?? null}
      onSelectLesson={onSelectFromNav}
    />
  );

  // Overflow ("⋮") menu: "about the note" for everyone, plus release
  // switching for enrolled students (the pinned release comes from the
  // scheme tree itself, `scheme.releaseId`).
  const actionsMenu = (
    <ProductReaderActionsMenu
      productId={product.id}
      enrollmentId={viewer.kind === 'enrolled' ? viewer.enrollmentId : null}
      currentReleaseId={scheme.releaseId}
    />
  );

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[1200px] px-5 md:px-6 lg:px-8',
        // Clear the floating SiteHeader card for anonymous visitors; the solid
        // app header sits flush, so signed-in viewers keep the tighter offset.
        loggedIn ? 'pt-6 md:pt-8' : 'pt-12 md:pt-16',
        isGuest && 'pb-24',
      )}
    >
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar (desktop only) */}
        <aside
          className={cn(
            'hidden self-start lg:block lg:sticky',
            loggedIn ? 'lg:top-[88px]' : 'lg:top-[112px]',
          )}
        >
          <ScrollArea
            className={loggedIn ? 'max-h-[calc(100vh-112px)]' : 'max-h-[calc(100vh-136px)]'}
          >
            <div className="flex flex-col gap-4 px-3">
              <CoverImage
                src={product.cover?.url}
                alt={product.title}
                seed={product.id}
                className="aspect-video rounded-2xl"
              />

              <div className="flex items-start justify-between gap-1.5">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
                    {product.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('nav.summary', {
                      modules: moduleCount,
                      lessons: lessonCount,
                    })}
                  </p>
                </div>
                <div className="-mr-1 shrink-0">{actionsMenu}</div>
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
            <div className="flex items-center gap-2">
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
              {actionsMenu}
            </div>
            {current ? (
              <p className="text-sm text-muted-foreground">
                {t('lesson.position', {
                  current: selectedIndex + 1,
                  total: lessonCount,
                })}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              'max-w-[820px]',
              // Enrolled study view: fill the viewport so the lesson nav pins
              // to the bottom — "Дальше" stays under the cursor across lessons
              // regardless of content length (no jump). Guests get the fixed
              // enroll banner at the bottom instead, so their nav stays in flow.
              !isGuest && 'flex min-h-[calc(100dvh-6.5rem)] flex-col',
            )}
          >
            <div className="flex-1">
              {current ? (
                /* Keyed remount (no AnimatePresence exit): the old lesson swaps
                   out instantly and the new one fades in, so the scroll-to-top
                   in `selectLesson` lands on the new content in the same frame
                   instead of watching the old article fade for 250ms first. */
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

                  <LessonBlocks
                    noteId={product.id}
                    lesson={current.lesson}
                    canAnswer={canAnswer}
                    savedAnswerMap={savedAnswerMap}
                  />
                </motion.article>
              ) : (
                <p className="text-sm text-muted-foreground">{t('nav.empty')}</p>
              )}
            </div>

            {current ? (
              <FooterNav
                sticky={!isGuest}
                hasPrev={hasPrev}
                hasNext={hasNext}
                position={t('lesson.position', {
                  current: selectedIndex + 1,
                  total: lessonCount,
                })}
                prevLabel={t('lesson.prev')}
                nextLabel={t('lesson.next')}
                prevAriaLabel={t('lesson.prevLabel')}
                nextAriaLabel={t('lesson.nextLabel')}
                onPrev={() => goTo(selectedIndex - 1)}
                onNext={() => goTo(selectedIndex + 1)}
              />
            ) : null}
          </div>
        </div>
      </div>

      {isGuest ? (
        <ProductReaderGuestBanner
          productId={product.id}
          loggedIn={viewer.loggedIn}
        />
      ) : null}
    </div>
  );
}

/**
 * The on-demand blocks region of the selected lesson. The lesson header above
 * paints instantly from the scheme; this part fetches the actual payload.
 * A zero-block lesson (per the scheme's `blockCount`) skips the fetch and
 * renders the empty copy directly. A load failure is a SECONDARY failure —
 * it surfaces as an inline retry box, never blows up the whole reader.
 */
function LessonBlocks({
  noteId,
  lesson,
  canAnswer,
  savedAnswerMap,
}: {
  noteId: string;
  lesson: PublicSchemeLesson;
  canAnswer: boolean;
  savedAnswerMap: Map<string, SavedBlockAnswer>;
}) {
  const t = useTranslations('product-reader');
  const isEmpty = lesson.blockCount === 0;
  const { data, isPending, isError, refetch } = useNoteLesson(
    noteId,
    isEmpty ? null : lesson.id,
  );

  if (isEmpty) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">{t('lesson.empty')}</p>
    );
  }

  if (isError && !data) {
    return <LessonBlocksError onRetry={() => void refetch()} />;
  }

  if (isPending || !data) {
    return (
      <LessonBlocksSkeleton
        rows={Math.min(Math.max(lesson.blockCount, 1), 4)}
      />
    );
  }

  return (
    <div className="mt-8 space-y-8">
      {data.blocks.map((block) => (
        <LessonBlockViewer
          key={block.id}
          block={block}
          ctx={{
            noteId,
            canAnswer,
            savedAnswer: savedAnswerMap.get(block.id) ?? null,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Inline (in-article) retry box for a failed lesson-blocks fetch — the scheme
 * around it is intact, so the reader chrome stays put.
 */
function LessonBlocksError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('product-reader');
  return (
    <div
      role="alert"
      className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
    >
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {t('lesson.errorTitle')}
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t('lesson.errorDescription')}
      </p>
      <Button variant="outline" onClick={onRetry} className="mt-1">
        {t('lesson.retry')}
      </Button>
    </div>
  );
}

function FooterNav({
  hasPrev,
  hasNext,
  position,
  prevLabel,
  nextLabel,
  prevAriaLabel,
  nextAriaLabel,
  onPrev,
  onNext,
  sticky,
}: {
  hasPrev: boolean;
  hasNext: boolean;
  position: string;
  prevLabel: string;
  nextLabel: string;
  prevAriaLabel: string;
  nextAriaLabel: string;
  onPrev: () => void;
  onNext: () => void;
  /** Pin to the viewport bottom (enrolled study view) vs. sit in flow. */
  sticky: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-border',
        sticky
          ? 'sticky bottom-0 z-10 mt-8 bg-background/90 py-4 backdrop-blur-sm'
          : 'mt-10 pt-5 md:mt-12',
      )}
    >
      <Button
        variant="outline"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label={prevAriaLabel}
      >
        <ArrowLeftIcon />
        {prevLabel}
      </Button>

      <p className="hidden text-sm text-muted-foreground md:block">
        {position}
      </p>

      <Button
        variant="outline"
        onClick={onNext}
        disabled={!hasNext}
        aria-label={nextAriaLabel}
      >
        {nextLabel}
        <ArrowRightIcon />
      </Button>
    </div>
  );
}

function ReaderError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('product-reader');
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:px-6 md:pt-8 lg:px-8">
      <div
        role="alert"
        className="mx-auto flex max-w-[520px] flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
      >
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t('content.errorTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t('content.errorDescription')}
        </p>
        <Button variant="outline" onClick={onRetry} className="mt-1">
          {t('content.retry')}
        </Button>
      </div>
    </div>
  );
}
