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
import { ProductReaderSearchableNav } from './product-reader-search';
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

// Prose / formula blocks get a real text selection on a search jump;
// every other block type ("element": code, graph, media, quiz, …) gets
// the pencil-hatch sweep (see `[data-hl='hatch']` in globals.css).
const TEXT_BLOCK_TYPES: ReadonlySet<string> = new Set(['html', 'katex']);

/** A search hit to reveal: which block, and the matched terms to select. */
type SearchTarget = { blockId: string; terms: string[] };

/** Highlighted terms (`<<hl>>…<</hl>>`) from a result snippet, lowercased. */
function extractHighlightTerms(snippet: string): string[] {
  const terms: string[] = [];
  for (const match of snippet.matchAll(/<<hl>>([\s\S]*?)<<\/hl>>/g)) {
    const term = match[1].trim().toLowerCase();
    if (term.length >= 2) terms.push(term);
  }
  return [...new Set(terms)];
}

type TextSegments = {
  el: HTMLElement;
  segments: { node: Text; start: number; len: number }[];
  total: number;
};

/** Walk the block's CURRENT text nodes from the live DOM (by id). */
function resolveTextSegments(blockId: string): TextSegments | null {
  const el = document.getElementById(blockId);
  if (!el) return null;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const segments: TextSegments['segments'] = [];
  let total = 0;
  for (
    let node = walker.nextNode();
    node !== null;
    node = walker.nextNode()
  ) {
    const len = node.textContent?.length ?? 0;
    if (len > 0) {
      segments.push({ node: node as Text, start: total, len });
      total += len;
    }
  }
  return total > 0 ? { el, segments, total } : null;
}

/** Map a global character index to a (text node, offset) within segments. */
function locateChar(
  segments: TextSegments['segments'],
  index: number,
): { node: Text; offset: number } {
  const last = segments[segments.length - 1];
  const clamped = Math.max(0, Math.min(index, last.start + last.len));
  for (const seg of segments) {
    if (clamped <= seg.start + seg.len) {
      return { node: seg.node, offset: clamped - seg.start };
    }
  }
  return { node: last.node, offset: last.len };
}

/**
 * Locate the matched span in the block's plain text: the earliest
 * matched term, extended to cover any other matched terms that sit close
 * after it (so a multi-word match reads as one phrase). Returns global
 * char offsets, or `null` if none of the terms are present.
 */
function findMatchRange(
  text: string,
  terms: string[],
): { start: number; end: number } | null {
  if (terms.length === 0) return null;
  const lower = text.toLowerCase();
  const firsts = terms
    .map((term) => ({ term, index: lower.indexOf(term) }))
    .filter((hit) => hit.index >= 0);
  if (firsts.length === 0) return null;

  const start = Math.min(...firsts.map((hit) => hit.index));
  const WINDOW = 160; // bundle nearby terms; leave distant repeats out
  let end = start;
  for (const { term } of firsts) {
    const index = lower.indexOf(term, start);
    if (index >= 0 && index <= start + WINDOW) {
      end = Math.max(end, index + term.length);
    }
  }
  return { start, end: Math.max(end, start + 1) };
}

/**
 * Highlight a search hit inside a text block like a mouse drag — but
 * only over the MATCHED span (`terms`), not the whole block. Scrolls the
 * match into view, sweeps the selection across it in real time, holds,
 * then releases. Nodes are RE-RESOLVED from the live DOM every frame:
 * React can replace the block's subtree around the jump (lesson remount
 * / entry animation), and `addRange` silently no-ops on a detached range
 * ("isn't in document"); re-resolving keeps it painting. The Selection
 * API isn't a CSS property, so rAF — not Framer Motion — drives it.
 */
function flashTextSelection(
  blockId: string,
  terms: string[],
  reduceMotion: boolean,
) {
  const selection = window.getSelection();
  if (!selection) return;
  const initial = resolveTextSegments(blockId);
  if (!initial) return;

  const fullText = initial.segments.map((s) => s.node.textContent).join('');
  const match = findMatchRange(fullText, terms);
  // Fall back to the whole block if the terms aren't found verbatim
  // (e.g. entity / whitespace normalisation differences).
  const start = match ? match.start : 0;
  const span = Math.max(1, (match ? match.end : initial.total) - start);

  // Bring the match itself into view (a deep match can sit below the
  // block's top). Centre it, clear of the sticky header.
  locateChar(initial.segments, start).node.parentElement?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'center',
  });

  const paint = (chars: number) => {
    const live = resolveTextSegments(blockId);
    if (!live) return;
    const a = locateChar(live.segments, start);
    const b = locateChar(live.segments, start + chars);
    try {
      const range = document.createRange();
      range.setStart(a.node, a.offset);
      range.setEnd(b.node, b.offset);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      /* node moved this frame — the next frame re-resolves. */
    }
  };

  // Lifecycle: sweep IN (grow the selection over the match) → a long
  // HOLD so it lingers → sweep OUT (retract the highlight back to the
  // start, the reverse of the entry — native selection can't fade, so
  // the "exit animation" is this shrink) → clear. Bail at any point if
  // the viewer took over the selection (anchor left the block), so we
  // don't fight a manual selection during the long hold.
  const sweepInMs = Math.min(600, Math.max(220, span * 14));
  const holdMs = 2600;
  const sweepOutMs = Math.min(750, Math.max(450, span * 18));
  const holdEnd = sweepInMs + holdMs;
  const exitEnd = holdEnd + sweepOutMs;

  const stillOurs = () => {
    const active = window.getSelection();
    const el = document.getElementById(blockId);
    return Boolean(active?.anchorNode && el?.contains(active.anchorNode));
  };
  const easeInOut = (p: number) =>
    p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;

  let startTs: number | null = null;
  const step = (ts: number) => {
    if (startTs === null) startTs = ts;
    const elapsed = ts - startTs;
    if (elapsed < sweepInMs) {
      const p = elapsed / sweepInMs;
      paint(Math.round((1 - (1 - p) * (1 - p)) * span)); // easeOutQuad
      requestAnimationFrame(step);
    } else if (elapsed < holdEnd) {
      if (!stillOurs()) return; // viewer took over — leave their selection
      paint(span);
      requestAnimationFrame(step);
    } else if (elapsed < exitEnd) {
      if (!stillOurs()) return;
      const p = (elapsed - holdEnd) / sweepOutMs;
      paint(Math.round((1 - easeInOut(p)) * span)); // retract to the start
      requestAnimationFrame(step);
    } else if (stillOurs()) {
      window.getSelection()?.removeAllRanges();
    }
  };
  requestAnimationFrame(step);
}

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
  // Search hit to reveal once its lesson loads: the block to scroll to +
  // the matched terms to select within it (from the result snippet).
  const [target, setTarget] = useState<SearchTarget | null>(null);

  const selectLesson = useCallback(
    (lessonId: string, options?: { skipScrollTop?: boolean }) => {
      // Shallow update: a router.replace would re-run the whole RSC
      // page (product + enrollments + scheme + lesson seed) on every
      // click, duplicating the client-side lesson fetch. The native
      // History API integrates with useSearchParams without a server
      // round-trip; the ?lesson= param still seeds direct loads.
      const url = new URL(window.location.href);
      url.searchParams.set(LESSON_PARAM, lessonId);
      window.history.replaceState(null, '', url);
      if (!options?.skipScrollTop) {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
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

  const onSelectResult = useCallback(
    (lessonId: string, blockId: string | null, snippet: string) => {
      setMobileNavOpen(false);
      if (blockId) {
        // Jump straight to the hit — skip the scroll-to-top so we don't
        // bounce to the top first; `LessonBlocks` scrolls to the match.
        selectLesson(lessonId, { skipScrollTop: true });
        setTarget({ blockId, terms: extractHighlightTerms(snippet) });
      } else {
        selectLesson(lessonId);
        setTarget(null);
      }
    },
    [selectLesson],
  );

  const consumeTarget = useCallback(() => setTarget(null), []);

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
    <ProductReaderSearchableNav
      noteId={product.id}
      modules={scheme.modules}
      selectedLessonId={current?.lesson.id ?? null}
      selectedModuleId={current?.module.id ?? null}
      onSelectLesson={onSelectFromNav}
      onSelectResult={onSelectResult}
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
        // NB: this top padding feeds the sidebar's sticky `top` below — keep
        // them in sync (sidebar top = header height + this padding) or the
        // sidebar gets a pre-pin "travel" zone that Chrome jerks through.
        loggedIn ? 'pt-6 md:pt-8' : 'pt-12 md:pt-16',
        isGuest && 'pb-24',
      )}
    >
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar (desktop only). Its sticky `top` MUST equal where it
            naturally starts in flow — header height + this column's top
            padding — so it pins with ZERO travel. Any gap between that start
            and the sticky line is the pre-pin "travel" zone Chrome renders as a
            1-2px jerk on scroll start (same invariant as the legal docs TOC).
              • signed-in: 73px flush app header + md:pt-8 (32px) = 105px
              • anon:      72px floating SiteHeader flow box + md:pt-16 (64px) = 136px
            max-h keeps a 24px bottom gap (top + 24). Keep top / padding / max-h
            in sync if any of them change. */}
        <aside
          className={cn(
            'hidden self-start lg:block lg:sticky',
            loggedIn ? 'lg:top-[105px]' : 'lg:top-[136px]',
          )}
        >
          <ScrollArea
            className={loggedIn ? 'max-h-[calc(100vh-129px)]' : 'max-h-[calc(100vh-160px)]'}
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
                    target={target}
                    onTargetConsumed={consumeTarget}
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
  target,
  onTargetConsumed,
}: {
  noteId: string;
  lesson: PublicSchemeLesson;
  canAnswer: boolean;
  savedAnswerMap: Map<string, SavedBlockAnswer>;
  /** A content-search hit to reveal once this lesson loads. */
  target: SearchTarget | null;
  onTargetConsumed: () => void;
}) {
  const t = useTranslations('product-reader');
  const isEmpty = lesson.blockCount === 0;
  const { data, isPending, isError, refetch } = useNoteLesson(
    noteId,
    isEmpty ? null : lesson.id,
  );

  const reduceMotion = useReducedMotion();

  // Once the targeted lesson's blocks are in the DOM, reveal the hit —
  // imperatively (the sanctioned "effect updates the DOM" path). Prose /
  // formulae get a real text selection over the MATCH, "как через мышку"
  // (it scrolls to + selects the matched terms); everything else gets
  // the pencil-hatch sweep driven by `data-hl='hatch'`. `onTargetConsumed`
  // resets the parent so a later tree navigation back here doesn't
  // re-fire a stale target.
  useEffect(() => {
    if (!target || !data) return;
    const block = data.blocks.find((b) => b.id === target.blockId);
    if (!block) return;
    const el = document.getElementById(target.blockId);
    if (!el) return;
    onTargetConsumed();
    if (TEXT_BLOCK_TYPES.has(block.type)) {
      flashTextSelection(target.blockId, target.terms, reduceMotion ?? false);
    } else {
      // Element block: scroll the whole block in, then a ~3s pencil-hatch
      // (see `pencil-hatch` in globals.css) so it's easy to notice.
      el.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      el.setAttribute('data-hl', 'hatch');
      window.setTimeout(() => el.removeAttribute('data-hl'), 3200);
    }
  }, [target, data, onTargetConsumed, reduceMotion]);

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
        // `id` is the jump-to-match anchor; `scroll-mt-28` clears the
        // sticky header. `data-hl='hatch'` (set in the effect) overlays
        // the layout-neutral pencil-hatch sweep on element blocks.
        <div
          key={block.id}
          id={block.id}
          data-block-type={block.type}
          className="scroll-mt-28 rounded-xl"
        >
          <LessonBlockViewer
            block={block}
            ctx={{
              noteId,
              canAnswer,
              savedAnswer: savedAnswerMap.get(block.id) ?? null,
            }}
          />
        </div>
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
