'use client';

import {
  CheckIcon,
  CopyIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  Share2Icon,
  UserPlusIcon,
  XIcon,
} from 'lucide-react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { InlineLatexEditor } from '@/shared/ui/inline-latex-editor';
import { InlineRichEditor } from '@/shared/ui/inline-rich-editor';
import { Input } from '@/shared/ui/input';
import { SectionNav, type SectionNavItem } from '@/shared/ui/section-nav';

import type { Product } from '../model/types';

import {
  ContentTree,
  type LessonNode,
  type ModuleNode,
} from './content-tree';
import { ProductCover } from './product-cover';

const SECTION_KEYS = [
  'content',
  'qa',
  'description',
  'team',
  'settings',
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type EmailRow = { id: string; value: string };

type ProductEditorViewProps = {
  product: Product;
  initialRailOpen?: boolean;
  initialSidebarWidth?: number;
};

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.6 };
const RAIL_COOKIE = 'learnic.product-editor.rail-closed';
const SIDEBAR_WIDTH_COOKIE = 'learnic.product-editor.sidebar-width';
const SIDEBAR_MIN_WIDTH = 160;
const SIDEBAR_MAX_WIDTH = 360;
const SIDEBAR_DEFAULT_WIDTH = 200;

function clampSidebarWidth(value: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
}

export function ProductEditorView({
  product,
  initialRailOpen = true,
  initialSidebarWidth = SIDEBAR_DEFAULT_WIDTH,
}: ProductEditorViewProps) {
  const t = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();
  const emailIdSeed = useId();
  const emailCounterRef = useRef(2);

  const [activeSection, setActiveSection] = useState<SectionKey>('content');
  const [emails, setEmails] = useState<EmailRow[]>(() => [
    { id: `${emailIdSeed}-0`, value: '' },
    { id: `${emailIdSeed}-1`, value: '' },
  ]);
  const [copied, setCopied] = useState(false);
  const [railOpen, setRailOpen] = useState(initialRailOpen);
  const [shareHighlight, setShareHighlight] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    clampSidebarWidth(initialSidebarWidth),
  );
  const railRef = useRef<HTMLDivElement>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(
    null,
  );

  const sectionItems = useMemo<SectionNavItem<SectionKey>[]>(
    () => SECTION_KEYS.map((key) => ({ key, label: t(`sections.${key}`) })),
    [t],
  );

  const [modules, setModules] = useState<ModuleNode[]>(() => [
    {
      id: 'mod-intro',
      title: 'Введение',
      lessons: [
        {
          id: 'lesson-welcome',
          title: 'Добро пожаловать',
          contentHtml:
            '<h2>Добро пожаловать на курс</h2><p>В этом уроке мы разберём, чего ждать от программы и как организован материал. К концу курса вы построите собственный мини-проект и сможете применять подход в реальных задачах.</p><ul><li>Что вы получите от курса</li><li>Как устроены модули и уроки</li><li>Какие инструменты понадобятся</li></ul>',
          formula: '',
        },
        {
          id: 'lesson-tools',
          title: 'Что понадобится',
          contentHtml:
            '<h2>Подготовка</h2><p>Минимум — современный браузер и желание учиться. Дальнейшие уроки сами подскажут, что именно установить под конкретную тему.</p>',
          formula: '',
        },
      ],
    },
    {
      id: 'mod-foundations',
      title: 'Основы',
      lessons: [
        {
          id: 'lesson-principles',
          title: 'Базовые принципы',
          contentHtml:
            '<h2>Базовые принципы</h2><p>Прежде чем переходить к практике, договоримся об основной терминологии и базовых принципах подхода.</p>',
          formula: 'a^2 + b^2 = c^2',
        },
        {
          id: 'lesson-workflow',
          title: 'Рабочий процесс',
          contentHtml:
            '<h2>Рабочий процесс</h2><p>Разберём типичный цикл работы: от постановки задачи до проверки результата.</p>',
          formula: '',
        },
        {
          id: 'lesson-practice',
          title: 'Практика',
          contentHtml:
            '<h2>Практика</h2><p>Решим первую задачу вместе и закрепим материал самостоятельно.</p>',
          formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
        },
      ],
    },
    {
      id: 'mod-advanced',
      title: 'Продвинутые темы',
      lessons: [
        {
          id: 'lesson-cases',
          title: 'Разбор кейсов',
          contentHtml:
            '<h2>Разбор кейсов</h2><p>Несколько разборов реальных задач с пояснением каждого решения шаг за шагом.</p>',
          formula: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
        },
      ],
    },
  ]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    'lesson-welcome',
  );

  // Plain derivation — React Compiler will memoize. A manual `useMemo` here
  // tripped `react-hooks/preserve-manual-memoization` because the imperative
  // early-return body wasn't analyzable.
  let selectedLesson:
    | { module: ModuleNode; lesson: LessonNode }
    | null = null;
  if (selectedLessonId) {
    for (const m of modules) {
      const found = m.lessons.find((l) => l.id === selectedLessonId);
      if (found) {
        selectedLesson = { module: m, lesson: found };
        break;
      }
    }
  }

  const updateSelectedLesson = useCallback(
    (updates: Partial<Pick<LessonNode, 'contentHtml' | 'formula'>>) => {
      if (!selectedLessonId) return;
      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) =>
            l.id === selectedLessonId ? { ...l, ...updates } : l,
          ),
        })),
      );
    },
    [selectedLessonId],
  );

  const onAddEmail = useCallback(() => {
    const next = emailCounterRef.current++;
    setEmails((prev) => [...prev, { id: `${emailIdSeed}-${next}`, value: '' }]);
  }, [emailIdSeed]);

  const onChangeEmail = useCallback((id: string, value: string) => {
    setEmails((prev) =>
      prev.map((row) => (row.id === id ? { ...row, value } : row)),
    );
  }, []);

  const onRemoveEmail = useCallback((id: string) => {
    setEmails((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const onCloseRail = useCallback(() => {
    setRailOpen(false);
    if (typeof document !== 'undefined') {
      // 1 year, lax — non-sensitive UI preference
      document.cookie = `${RAIL_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  const onOpenRail = useCallback(() => {
    setRailOpen(true);
    if (typeof document !== 'undefined') {
      document.cookie = `${RAIL_COOKIE}=; path=/; max-age=0; samesite=lax`;
    }
    // Only scroll on mobile/tablet — on desktop the rail is already in the
    // sticky right column. Defer to next frame so the rail has mounted.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 1023px)').matches
    ) {
      requestAnimationFrame(() => {
        railRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    setShareHighlight(true);
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setShareHighlight(false);
      highlightTimerRef.current = null;
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (sidebarWidth === initialSidebarWidth) return;
    const handle = window.setTimeout(() => {
      document.cookie = `${SIDEBAR_WIDTH_COOKIE}=${sidebarWidth}; path=/; max-age=31536000; samesite=lax`;
    }, 250);
    return () => window.clearTimeout(handle);
  }, [sidebarWidth, initialSidebarWidth]);

  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined' && dragStateRef.current) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, []);

  const onResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      dragStateRef.current = {
        startX: event.clientX,
        startWidth: sidebarWidth,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarWidth],
  );

  const onResizeMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const delta = event.clientX - drag.startX;
      setSidebarWidth(clampSidebarWidth(drag.startWidth + delta));
    },
    [],
  );

  const onResizeEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    },
    [],
  );

  const onResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const step = event.shiftKey ? 32 : 8;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSidebarWidth((w) => clampSidebarWidth(w - step));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSidebarWidth((w) => clampSidebarWidth(w + step));
      } else if (event.key === 'Home') {
        event.preventDefault();
        setSidebarWidth(SIDEBAR_MIN_WIDTH);
      } else if (event.key === 'End') {
        event.preventDefault();
        setSidebarWidth(SIDEBAR_MAX_WIDTH);
      }
    },
    [],
  );

  const onResizeDoubleClick = useCallback(() => {
    setSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
  }, []);

  const onCopyLink = useCallback(async () => {
    const link = t('share.linkValue');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard is best-effort
    }
  }, [t]);

  const titleText = product.title.trim().length > 0 ? product.title : t('untitled');

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      {/* Cover */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="h-32 w-full md:h-44 lg:h-56"
      >
        <ProductCover
          productId={product.id}
          initialProduct={product}
          className="h-full rounded-2xl ring-1 ring-foreground/5"
        />
      </motion.div>

      {/* Header */}
      <header className="mt-5 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-[28px]">
          {titleText}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          >
            <PencilIcon /> {t('actions.edit')}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onOpenRail}
            className="gap-1.5"
          >
            <Share2Icon /> {t('actions.share')}
          </Button>
        </div>
      </header>

      <div className="mt-5 border-t border-border md:mt-6" />

      {/* Body */}
      <MotionConfig
        transition={reduceMotion ? { duration: 0 } : SPRING}
      >
      <div className="mt-5 flex flex-col gap-6 md:mt-7 lg:flex-row lg:items-start lg:gap-8">
        {/* Sidebar nav (desktop) */}
        <aside
          aria-label={t('sections.content')}
          style={{ width: sidebarWidth }}
          className="relative hidden lg:block lg:shrink-0 lg:sticky lg:top-36 lg:self-start"
        >
          <nav
            aria-label={t('sections.content')}
            className="pr-3"
          >
            <ul className="flex flex-col gap-1 text-sm">
              <ContentNavItem
                active={activeSection === 'content'}
                label={t('sections.content')}
                onActivate={() => setActiveSection('content')}
                reduceMotion={!!reduceMotion}
              >
                <ContentTree
                  modules={modules}
                  onChange={setModules}
                  selectedLessonId={
                    activeSection === 'content' ? selectedLessonId : null
                  }
                  onSelectLesson={(_moduleId, lessonId) => {
                    setSelectedLessonId(lessonId);
                    setActiveSection('content');
                  }}
                />
              </ContentNavItem>
              {SECTION_KEYS.filter((key) => key !== 'content').map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(key)}
                    className={cn(
                      'w-full rounded-md px-2.5 py-1.5 text-left transition-colors',
                      activeSection === key
                        ? 'bg-muted font-semibold text-foreground'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {t(`sections.${key}`)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label={t('sidebar.resizeAriaLabel')}
            aria-valuenow={sidebarWidth}
            aria-valuemin={SIDEBAR_MIN_WIDTH}
            aria-valuemax={SIDEBAR_MAX_WIDTH}
            tabIndex={0}
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
            onKeyDown={onResizeKeyDown}
            onDoubleClick={onResizeDoubleClick}
            className="group/resize absolute inset-y-0 -right-1.5 z-10 flex w-3 cursor-col-resize touch-none items-stretch justify-center rounded-full focus-visible:outline-none"
          >
            <div className="h-full w-px rounded-full bg-border/0 transition-colors group-hover/resize:bg-border group-focus-visible/resize:bg-brand" />
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 lg:flex-1">
          {/* Mobile/tablet horizontal tabs */}
          <div className="-mx-4 overflow-x-auto px-4 lg:hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <SectionNav
              variant="horizontal"
              items={sectionItems}
              value={activeSection}
              onChange={setActiveSection}
              ariaLabel={t('sections.content')}
              underlineLayoutId="editor-tab-underline"
            />
          </div>

          {/* Section content */}
          <div className="mt-2 lg:mt-0">
            <AnimatePresence mode="wait" initial={false}>
              {activeSection === 'content' ? (
                selectedLesson ? (
                  <motion.div
                    key={`lesson-${selectedLesson.lesson.id}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="flex flex-col gap-6"
                  >
                    <div className="flex flex-col gap-1 px-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {selectedLesson.module.title}
                      </p>
                      <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                        {selectedLesson.lesson.title}
                      </h2>
                    </div>
                    <InlineRichEditor
                      value={selectedLesson.lesson.contentHtml ?? ''}
                      onChange={(html) =>
                        updateSelectedLesson({ contentHtml: html })
                      }
                      placeholder={t('contentEditor.placeholder')}
                      emptyText={t('contentEditor.empty')}
                    />
                    <InlineLatexEditor
                      value={selectedLesson.lesson.formula ?? ''}
                      onChange={(formula) => updateSelectedLesson({ formula })}
                      emptyText={t('formula.empty')}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-lesson"
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
                  >
                    <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                      {t('lessonEmpty.title')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t('lessonEmpty.description')}
                    </p>
                  </motion.div>
                )
              ) : (
                <motion.div
                  key={`placeholder-${activeSection}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
                >
                  <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                    {t('sectionPlaceholder.title')}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t('sectionPlaceholder.description')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add section */}
          <div className="relative mt-8 flex items-center justify-center">
            <span
              aria-hidden
              className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
            />
            <Button
              variant="outline"
              size="sm"
              className="relative gap-1.5 bg-background"
            >
              <PlusIcon /> {t('actions.addSection')}
            </Button>
          </div>
        </main>

        {/* Right rail */}
        <AnimatePresence initial={false} mode="popLayout">
          {railOpen ? (
            <motion.aside
              key="rail"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 20, width: 0 }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, x: 0, width: 'auto' }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 20, width: 0 }
              }
              transition={reduceMotion ? { duration: 0 } : SPRING}
              className="flex flex-col gap-5 lg:shrink-0 lg:overflow-visible"
            >
              <div
                ref={railRef}
                className={cn(
                  'flex scroll-mt-32 flex-col gap-5 rounded-2xl transition-shadow duration-300 lg:w-[320px] lg:sticky lg:top-32 lg:self-start',
                  shareHighlight && 'ring-3 ring-brand/50',
                )}
              >
                {/* Share card */}
                <div className="relative rounded-2xl bg-muted/40 p-5 dark:bg-muted/30">
                  <h3 className="pr-7 font-heading text-base font-semibold tracking-tight text-foreground">
                    {t('share.title')}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t('share.description')}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('rail.close')}
                    onClick={onCloseRail}
                    className="absolute right-3 top-3 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  >
                    <XIcon />
                  </Button>
                  <label className="mt-4 block text-sm font-medium text-foreground">
                    {t('share.linkLabel')}
                  </label>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Input
                      readOnly
                      value={t('share.linkValue')}
                      className="h-10 flex-1 bg-background text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label={t('share.copy')}
                      onClick={onCopyLink}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      {copied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
                    </Button>
                  </div>
                </div>

                {/* Invite card */}
                <div className="rounded-2xl bg-muted/40 p-5 dark:bg-muted/30">
                  <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                    <UserPlusIcon className="size-4" />
                  </div>
                  <h3 className="mt-4 font-heading text-base font-semibold tracking-tight text-foreground">
                    {t('invite.title')}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t('invite.description')}
                  </p>
                  <label className="mt-4 block text-sm font-medium text-foreground">
                    {t('invite.emailLabel')}
                  </label>
                  <ul className="mt-1.5 flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                      {emails.map((email) => (
                        <motion.li
                          key={email.id}
                          layout
                          initial={
                            reduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, height: 0, overflow: 'hidden' }
                          }
                          animate={
                            reduceMotion
                              ? { opacity: 1 }
                              : {
                                  opacity: 1,
                                  height: 'auto',
                                  transitionEnd: { overflow: 'visible' },
                                }
                          }
                          exit={
                            reduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, height: 0, overflow: 'hidden' }
                          }
                          transition={
                            reduceMotion ? { duration: 0 } : { ...SPRING, mass: 0.8 }
                          }
                        >
                          <div className="group/email relative flex items-center gap-1.5">
                            <div className="relative flex-1">
                              <MailIcon
                                aria-hidden
                                className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                              />
                              <Input
                                type="email"
                                value={email.value}
                                onChange={(event) =>
                                  onChangeEmail(email.id, event.target.value)
                                }
                                placeholder={t('invite.emailPlaceholder')}
                                className="h-10 bg-background pl-8 pr-2 text-sm"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t('invite.remove')}
                              onClick={() => onRemoveEmail(email.id)}
                              className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/5 hover:text-foreground focus-visible:opacity-100 group-hover/email:opacity-100"
                            >
                              <XIcon />
                            </Button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <button
                    type="button"
                    onClick={onAddEmail}
                    className="mt-2.5 inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand/80"
                  >
                    <PlusIcon className="size-4" /> {t('invite.addAnother')}
                  </button>
                  <div className="mt-5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={onCloseRail}
                      className="h-10 flex-1 bg-background"
                    >
                      {t('invite.cancel')}
                    </Button>
                    <Button
                      size="lg"
                      onClick={onCloseRail}
                      className="h-10 flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
                    >
                      {t('invite.confirm')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
      </MotionConfig>
    </div>
  );
}

/**
 * "Контент" sidebar entry that hosts the lesson tree. The tree expands
 * (animated open) only while the section is active OR the entry is being
 * hovered / has keyboard focus inside it; otherwise the entry collapses to
 * a single line, matching the rest of the section nav.
 */
function ContentNavItem({
  active,
  label,
  onActivate,
  reduceMotion,
  children,
}: {
  active: boolean;
  label: string;
  onActivate: () => void;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const open = active || hovered || focused;

  const onBlurCapture = (event: ReactFocusEvent<HTMLLIElement>) => {
    // Only flip focused → false when focus actually leaves the entry, not
    // when it just hops between descendants (e.g. tree row → kebab menu).
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setFocused(false);
  };

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={onBlurCapture}
    >
      <button
        type="button"
        onClick={onActivate}
        className={cn(
          'w-full rounded-md px-2.5 py-1.5 text-left transition-colors',
          active
            ? 'bg-muted font-semibold text-foreground'
            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        )}
      >
        {label}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="tree"
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }
            }
            animate={
              reduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 1,
                    height: 'auto',
                    transitionEnd: { overflow: 'visible' },
                  }
            }
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, overflow: 'hidden' }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.2,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{ overflow: 'hidden' }}
            className="mt-1"
          >
            <div className="max-h-[min(60vh,520px)] overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

