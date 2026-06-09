'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  PanelLeftIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  usePathname,
  useRouter,
} from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
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

import { noteContentKey, useNoteContent } from '../api/use-note-content';
import { myBlockAnswersKey, useMySavedAnswers } from '../api/use-saved-answers';
import type {
  PublicLesson,
  PublicModule,
  PublicNoteContent,
} from '../model/public-content';
import type { SavedBlockAnswer } from '../model/saved-answer';
import type { Product } from '../model/types';

import { LessonBlockViewer } from './lesson-block-viewers';
import { ProductReaderGuestBanner } from './product-reader-guest-banner';
import { ProductReaderNav } from './product-reader-nav';
import { ProductReaderReleaseSwitcher } from './product-reader-release-switcher';
import { ProductReaderSkeleton } from './product-reader-skeleton';

export type ReaderViewer =
  | { kind: 'enrolled'; enrollmentId: string }
  | { kind: 'guest'; loggedIn: boolean };

type ProductReaderViewProps = {
  product: Product;
  viewer: ReaderViewer;
  initialContent: PublicNoteContent | null;
  /** Enrolled viewer's saved answers, used to restore selections + verdicts. */
  initialSavedAnswers: SavedBlockAnswer[];
};

const LESSON_PARAM = 'lesson';
const EASE = [0.32, 0.72, 0, 1] as const;

type FlatLesson = {
  lesson: PublicLesson;
  module: PublicModule;
};

function flattenLessons(content: PublicNoteContent | undefined): FlatLesson[] {
  if (!content) return [];
  const flat: FlatLesson[] = [];
  for (const mod of content.modules) {
    for (const lesson of mod.lessons) {
      flat.push({ lesson, module: mod });
    }
  }
  return flat;
}

export function ProductReaderView({
  product,
  viewer,
  initialContent,
  initialSavedAnswers,
}: ProductReaderViewProps) {
  const queryClient = useQueryClient();
  // Seed the TanStack Query cache from the server-rendered content (and the
  // saved answers) before the first client paint, so it matches the SSR HTML,
  // we don't refetch, and restored selections appear without a flash.
  useState(() => {
    if (initialContent) {
      queryClient.setQueryData(noteContentKey(product.id), initialContent);
    }
    queryClient.setQueryData(myBlockAnswersKey(product.id), initialSavedAnswers);
    return null;
  });
  // …and RE-seed whenever the server hands down new content — e.g. after a
  // guest enrolls and `router.refresh()` re-runs the RSC page: the enrolled
  // viewer reads their *pinned* release, which can differ from the anonymous
  // latest-published tree already sitting in the still-fresh cache.
  useEffect(() => {
    if (initialContent) {
      queryClient.setQueryData(noteContentKey(product.id), initialContent);
    }
    queryClient.setQueryData(myBlockAnswersKey(product.id), initialSavedAnswers);
  }, [initialContent, initialSavedAnswers, product.id, queryClient]);

  const { data, isPending, isError, refetch } = useNoteContent(product.id);

  if (isPending && !data) {
    return <ProductReaderSkeleton />;
  }

  if (isError && !data) {
    return <ReaderError onRetry={() => void refetch()} />;
  }

  if (!data) {
    return <ProductReaderSkeleton />;
  }

  return <ReaderContent product={product} viewer={viewer} content={data} />;
}

function ReaderContent({
  product,
  viewer,
  content,
}: {
  product: Product;
  viewer: ReaderViewer;
  content: PublicNoteContent;
}) {
  const t = useTranslations('product-reader');
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();

  const flat = useMemo(() => flattenLessons(content), [content]);

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

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const selectLesson = useCallback(
    (lessonId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(LESSON_PARAM, lessonId);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    },
    [pathname, reduceMotion, router, searchParams],
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

  const moduleCount = content.modules.length;
  const lessonCount = flat.length;
  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < flat.length - 1;

  const nav = (
    <ProductReaderNav
      modules={content.modules}
      selectedLessonId={current?.lesson.id ?? null}
      selectedModuleId={current?.module.id ?? null}
      onSelectLesson={onSelectFromNav}
    />
  );

  // Enrolled students can switch which release of the note they study; the
  // pinned release comes from the content tree itself (`content.releaseId`).
  const releaseSwitcher =
    viewer.kind === 'enrolled' ? (
      <ProductReaderReleaseSwitcher
        productId={product.id}
        enrollmentId={viewer.enrollmentId}
        currentReleaseId={content.releaseId}
      />
    ) : null;

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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/marketplace/${product.id}`)}
                className="-ml-1 w-fit text-muted-foreground"
              >
                <ArrowLeftIcon />
                {t('nav.about')}
              </Button>

              <ReaderCover cover={product.cover} title={product.title} />

              <div className="flex flex-col gap-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {product.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('nav.summary', {
                    modules: moduleCount,
                    lessons: lessonCount,
                  })}
                </p>
              </div>

              {releaseSwitcher ? (
                <>
                  <Separator />
                  {releaseSwitcher}
                </>
              ) : null}

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
                  {releaseSwitcher}
                  {releaseSwitcher ? <Separator /> : null}
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

                  {current.lesson.blocks.length === 0 ? (
                    <p className="mt-8 text-sm text-muted-foreground">
                      {t('lesson.empty')}
                    </p>
                  ) : (
                    <div className="mt-8 space-y-8">
                      {current.lesson.blocks.map((block) => (
                        <LessonBlockViewer
                          key={block.id}
                          block={block}
                          ctx={{
                            noteId: product.id,
                            canAnswer,
                            savedAnswer: savedAnswerMap.get(block.id) ?? null,
                          }}
                        />
                      ))}
                    </div>
                  )}
              </motion.article>
            ) : (
              <p className="text-sm text-muted-foreground">{t('nav.empty')}</p>
            )}

            {current ? (
              <FooterNav
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

function ReaderCover({
  cover,
  title,
}: {
  cover: Product['cover'];
  title: string;
}) {
  if (cover) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={cover.url}
          alt={title}
          fill
          sizes="280px"
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/40">
      <BookOpenIcon className="size-7 text-muted-foreground" aria-hidden />
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
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-5 md:mt-12">
      {hasPrev ? (
        <Button
          variant="ghost"
          onClick={onPrev}
          aria-label={prevAriaLabel}
        >
          <ArrowLeftIcon />
          {prevLabel}
        </Button>
      ) : (
        <span aria-hidden className="invisible">
          <Button variant="ghost" tabIndex={-1}>
            <ArrowLeftIcon />
            {prevLabel}
          </Button>
        </span>
      )}

      <p className="hidden text-sm text-muted-foreground md:block">
        {position}
      </p>

      {hasNext ? (
        <Button
          variant="outline"
          onClick={onNext}
          aria-label={nextAriaLabel}
        >
          {nextLabel}
          <ArrowRightIcon />
        </Button>
      ) : (
        <span aria-hidden className="invisible">
          <Button variant="outline" tabIndex={-1}>
            {nextLabel}
            <ArrowRightIcon />
          </Button>
        </span>
      )}
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
