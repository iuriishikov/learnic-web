'use client';

import {
  CheckIcon,
  ChevronRightIcon,
  CopyIcon,
  ImageUpIcon,
  ListTreeIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  RotateCwIcon,
  Share2Icon,
  Trash2Icon,
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
  type ChangeEvent as ReactChangeEvent,
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
import { Input } from '@/shared/ui/input';
import { SectionNav, type SectionNavItem } from '@/shared/ui/section-nav';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Skeleton } from '@/shared/ui/skeleton';

import type {
  CourseDraft,
  DraftLesson,
  DraftModule,
  LessonBlock,
} from '../model/draft';
import type { Product } from '../model/types';

import {
  CourseDraftError,
  useCourseDraft,
} from '../api/use-course-draft';
import { useCourseContentWs } from '../api/use-course-content-ws';
import { useProductEventsWs } from '../api/use-product-events-ws';
import {
  useAddBlockMutation,
  useAddLessonMutation,
  useAddModuleMutation,
  useDeleteBlockMutation,
  useDeleteLessonMutation,
  useDeleteModuleMutation,
  useMoveLessonMutation,
  useRenameLessonMutation,
  useRenameModuleMutation,
  useReorderBlocksMutation,
  useReorderLessonsMutation,
  useReorderModulesMutation,
  useUpdateHtmlBlockMutation,
  useUpdateKatexBlockMutation,
} from '../api/use-course-mutations';
import { useProductQuery } from '../api/use-product';
import {
  useChangeProductNameMutation,
  useRemoveProductCoverMutation,
  useSetProductCoverMutation,
} from '../api/use-product-mutations';

import {
  ContentTree,
  type ContentTreeModule,
} from './content-tree';
import {
  LessonBlocks,
  type CreatableBlockType,
} from './lesson-blocks';
import { ProductCover } from './product-cover';
import { ProductDescriptionSection } from './product-description-section';
import { ProductQASection } from './product-qa-section';
import { ProductSettingsSection } from './product-settings-section';
import { ProductTeamSection } from './product-team-section';

const SECTION_KEYS = [
  'content',
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

function findLessonInDraft(
  draft: CourseDraft | undefined,
  lessonId: string | null,
): { module: DraftModule; lesson: DraftLesson } | null {
  if (!draft || !lessonId) return null;
  for (const m of draft.modules) {
    const lesson = m.lessons.find((l) => l.id === lessonId);
    if (lesson) return { module: m, lesson };
  }
  return null;
}

export function ProductEditorView({
  product: initialProduct,
  initialRailOpen = true,
  initialSidebarWidth = SIDEBAR_DEFAULT_WIDTH,
}: ProductEditorViewProps) {
  const t = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();
  const emailIdSeed = useId();
  const emailCounterRef = useRef(2);

  // Subscribe to the product query so name / description / cover edits surface
  // here without re-mounting from props. The server-rendered prop seeds
  // initialData, so the first paint matches the SSR HTML.
  const productQuery = useProductQuery(initialProduct.id, initialProduct);
  const product = productQuery.data ?? initialProduct;

  const isCourse = product.type === 'course';

  // Course draft (modules / lessons / blocks)
  const draftQuery = useCourseDraft(product.id, isCourse);
  useCourseContentWs(product.id, isCourse);
  // Product-level deltas (metadata, cover, status, Q&A) — both courses and webinars.
  useProductEventsWs(product.id, true);

  // Mutations
  const addModule = useAddModuleMutation(product.id);
  const renameModule = useRenameModuleMutation(product.id);
  const deleteModule = useDeleteModuleMutation(product.id);
  const reorderModules = useReorderModulesMutation(product.id);
  const addLesson = useAddLessonMutation(product.id);
  const renameLesson = useRenameLessonMutation(product.id);
  const deleteLesson = useDeleteLessonMutation(product.id);
  const reorderLessons = useReorderLessonsMutation(product.id);
  const moveLesson = useMoveLessonMutation(product.id);
  const addBlock = useAddBlockMutation(product.id);
  const updateHtmlBlock = useUpdateHtmlBlockMutation(product.id);
  const updateKatexBlock = useUpdateKatexBlockMutation(product.id);
  const deleteBlock = useDeleteBlockMutation(product.id);
  const reorderBlocks = useReorderBlocksMutation(product.id);
  const renameProduct = useChangeProductNameMutation(product.id);
  const setCover = useSetProductCoverMutation(product.id);
  const removeCover = useRemoveProductCoverMutation(product.id);

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
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [userSelectedLessonId, setUserSelectedLessonId] = useState<
    string | null
  >(null);
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null);
  const [titleEditing, setTitleEditing] = useState(false);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  // Effective selection: respect the user's pick when the lesson still exists
  // in the draft; otherwise fall back to the first available lesson. This is
  // a derived value — no effect needed, no flicker on draft changes after
  // a delete or DRAFT_RESET.
  const selectedLessonId = useMemo(() => {
    if (!draftQuery.data) return userSelectedLessonId;
    if (
      userSelectedLessonId &&
      findLessonInDraft(draftQuery.data, userSelectedLessonId)
    ) {
      return userSelectedLessonId;
    }
    const fallback = draftQuery.data.modules.find((m) => m.lessons.length > 0)
      ?.lessons[0]?.id;
    return fallback ?? null;
  }, [draftQuery.data, userSelectedLessonId]);


  const sectionItems = useMemo<SectionNavItem<SectionKey>[]>(
    () => SECTION_KEYS.map((key) => ({ key, label: t(`sections.${key}`) })),
    [t],
  );

  const treeModules = useMemo<ContentTreeModule[]>(() => {
    if (!draftQuery.data) return [];
    return draftQuery.data.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.lessons.map((l) => ({ id: l.id, title: l.title })),
    }));
  }, [draftQuery.data]);

  const selectedLesson = findLessonInDraft(draftQuery.data, selectedLessonId);

  /* ---------- Tree mutation handlers ---------- */

  const handleAddModule = useCallback(async () => {
    try {
      const result = await addModule.mutateAsync({
        title: t('tree.newModule'),
      });
      setPendingRenameId(result.id);
    } catch {
      // toast handled by mutation
    }
  }, [addModule, t]);

  const handleRenameModule = useCallback(
    (moduleId: string, title: string) => {
      renameModule.mutate({ moduleId, title });
    },
    [renameModule],
  );

  const handleDeleteModule = useCallback(
    (moduleId: string) => {
      deleteModule.mutate({ moduleId });
    },
    [deleteModule],
  );

  const handleReorderModules = useCallback(
    (orderedIds: string[]) => {
      reorderModules.mutate({ orderedIds });
    },
    [reorderModules],
  );

  const handleAddLesson = useCallback(
    async (moduleId: string) => {
      try {
        const result = await addLesson.mutateAsync({
          moduleId,
          title: t('tree.newLesson'),
        });
        setUserSelectedLessonId(result.id);
        setPendingRenameId(result.id);
      } catch {
        // toast handled by mutation
      }
    },
    [addLesson, t],
  );

  const handleRenameLesson = useCallback(
    (lessonId: string, title: string) => {
      renameLesson.mutate({ lessonId, title });
    },
    [renameLesson],
  );

  const handleDeleteLesson = useCallback(
    (lessonId: string) => {
      if (selectedLessonId === lessonId) setUserSelectedLessonId(null);
      deleteLesson.mutate({ lessonId });
    },
    [deleteLesson, selectedLessonId],
  );

  const handleReorderLessons = useCallback(
    (moduleId: string, orderedIds: string[]) => {
      reorderLessons.mutate({ moduleId, orderedIds });
    },
    [reorderLessons],
  );

  const handleMoveLesson = useCallback(
    (lessonId: string, targetModuleId: string) => {
      moveLesson.mutate({ lessonId, targetModuleId });
    },
    [moveLesson],
  );

  /* ---------- Block mutation handlers ---------- */

  const handleAddBlock = useCallback(
    async (type: CreatableBlockType) => {
      if (!selectedLessonId) return;
      await addBlock
        .mutateAsync({ lessonId: selectedLessonId, type })
        .catch(() => undefined);
    },
    [addBlock, selectedLessonId],
  );

  const handleUpdateHtmlBlock = useCallback(
    (blockId: string, html: string) => {
      updateHtmlBlock.mutate({ blockId, html });
    },
    [updateHtmlBlock],
  );

  const handleUpdateKatexBlock = useCallback(
    (blockId: string, source: string) => {
      updateKatexBlock.mutate({ blockId, source });
    },
    [updateKatexBlock],
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      deleteBlock.mutate({ blockId });
    },
    [deleteBlock],
  );

  const handleReorderBlocks = useCallback(
    (orderedIds: string[]) => {
      if (!selectedLessonId) return;
      reorderBlocks.mutate({ lessonId: selectedLessonId, orderedIds });
    },
    [reorderBlocks, selectedLessonId],
  );

  /* ---------- Title rename ---------- */

  const handleCommitTitle = useCallback(
    (next: string) => {
      const trimmed = next.trim();
      setTitleEditing(false);
      if (trimmed && trimmed !== product.title) {
        renameProduct.mutate({ value: trimmed });
      }
    },
    [product.title, renameProduct],
  );

  /* ---------- Email rail ---------- */

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
      document.cookie = `${RAIL_COOKIE}=1; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  const onOpenRail = useCallback(() => {
    setRailOpen(true);
    if (typeof document !== 'undefined') {
      document.cookie = `${RAIL_COOKIE}=; path=/; max-age=0; samesite=lax`;
    }
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

  const onReplaceCover = useCallback(() => {
    coverFileInputRef.current?.click();
  }, []);

  const onDeleteCover = useCallback(() => {
    if (coverFile) {
      // Just discard the local preview if user hasn't uploaded yet.
      setCoverFile(null);
      return;
    }
    removeCover.mutate();
  }, [coverFile, removeCover]);

  const onCoverFileChange = useCallback(
    (event: ReactChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      setCoverFile(file);
      setCover.mutate(
        { file },
        {
          onSettled: (_data, error) => {
            // On success, clear the local preview — server now has the new
            // cover and the product query will be re-fetched.
            if (!error) setCoverFile(null);
          },
        },
      );
    },
    [setCover],
  );

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
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
      {/* Cover */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="h-28 w-full md:h-44 lg:h-56"
      >
        <ProductCover
          productId={product.id}
          initialProduct={product}
          previewFile={coverFile}
          className="h-full rounded-2xl ring-1 ring-foreground/5"
        >
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={onReplaceCover}
              aria-label={t('cover.replace')}
              className="bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
            >
              <ImageUpIcon />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={onDeleteCover}
              disabled={!coverFile}
              aria-label={t('cover.delete')}
              className="bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
            >
              <Trash2Icon />
            </Button>
          </div>
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onCoverFileChange}
          />
        </ProductCover>
      </motion.div>

      {/* Header */}
      <header className="mt-4 flex items-center gap-2 md:mt-6 md:gap-6">
        {titleEditing ? (
          <TitleEditor
            initial={product.title}
            onCommit={handleCommitTitle}
            onCancel={() => setTitleEditing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setTitleEditing(true)}
            aria-label={t('actions.edit')}
            className="group/title -mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-muted/40"
          >
            <h1 className="font-heading truncate text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-[28px]">
              {titleText}
            </h1>
            <PencilIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground opacity-100 transition-opacity md:opacity-0 group-hover/title:md:opacity-100 group-focus-visible/title:md:opacity-100"
            />
          </button>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {/* Edit — only on tablet+; on mobile the title button itself opens the editor */}
          <Button
            onClick={() => setTitleEditing(true)}
            className="hidden h-9 gap-1.5 bg-brand px-4 text-brand-foreground hover:bg-brand/90 md:inline-flex"
          >
            <PencilIcon /> {t('actions.edit')}
          </Button>
          {/* Share — icon-only on mobile, with label on sm+ */}
          <Button
            variant="outline"
            onClick={onOpenRail}
            aria-label={t('actions.share')}
            className="h-9 gap-1.5 px-3 md:px-4"
          >
            <Share2Icon />
            <span className="hidden sm:inline">{t('actions.share')}</span>
          </Button>
        </div>
      </header>

      <div className="mt-4 border-t border-border md:mt-6" />

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
                <DraftTree
                  isCourse={isCourse}
                  query={draftQuery}
                  modules={treeModules}
                  selectedLessonId={
                    activeSection === 'content' ? selectedLessonId : null
                  }
                  onSelectLesson={(_moduleId, lessonId) => {
                    setUserSelectedLessonId(lessonId);
                    setActiveSection('content');
                  }}
                  onAddModule={handleAddModule}
                  onRenameModule={handleRenameModule}
                  onDeleteModule={handleDeleteModule}
                  onReorderModules={handleReorderModules}
                  onAddLesson={handleAddLesson}
                  onRenameLesson={handleRenameLesson}
                  onDeleteLesson={handleDeleteLesson}
                  onReorderLessons={handleReorderLessons}
                  onMoveLesson={handleMoveLesson}
                  pendingRenameId={pendingRenameId}
                  onPendingRenameResolved={() => setPendingRenameId(null)}
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

          {/* Mobile/tablet only: list-cell trigger that opens the course tree
              Sheet — desktop uses the persistent sidebar instead. */}
          {isCourse && activeSection === 'content' ? (
            <button
              type="button"
              onClick={() => setMobileTreeOpen(true)}
              aria-label={t('tree.heading')}
              className="-mx-1 mt-3 flex w-[calc(100%+0.5rem)] items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted lg:hidden"
            >
              <ListTreeIcon className="size-5 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 flex-1 flex-col">
                {selectedLesson ? (
                  <>
                    <span className="truncate text-sm font-semibold text-foreground">
                      {selectedLesson.lesson.title}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {selectedLesson.module.title}
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-foreground">
                    {t('tree.heading')}
                  </span>
                )}
              </span>
              <ChevronRightIcon
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground"
              />
            </button>
          ) : null}

          {/* Section content */}
          <div className="mt-5 lg:mt-0">
            <AnimatePresence mode="wait" initial={false}>
              {activeSection === 'content' ? (
                <ContentSection
                  key="content"
                  reduceMotion={!!reduceMotion}
                  isCourse={isCourse}
                  query={draftQuery}
                  selectedLesson={selectedLesson}
                  onUpdateHtml={handleUpdateHtmlBlock}
                  onUpdateKatex={handleUpdateKatexBlock}
                  onAddBlock={handleAddBlock}
                  onRemoveBlock={handleDeleteBlock}
                  onReorderBlocks={handleReorderBlocks}
                />
              ) : activeSection === 'description' ? (
                <div key="description" className="flex flex-col gap-10">
                  <ProductDescriptionSection
                    productId={product.id}
                    description={product.description}
                    durationHours={product.durationHours}
                  />
                  <ProductQASection productId={product.id} />
                </div>
              ) : activeSection === 'team' ? (
                <ProductTeamSection key="team" />
              ) : activeSection === 'settings' ? (
                <ProductSettingsSection key="settings" product={product} />
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
                <div className="relative rounded-2xl bg-muted p-5">
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
                <div className="rounded-2xl bg-muted p-5">
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

      {/* Mobile/tablet course tree Sheet */}
      <Sheet open={mobileTreeOpen} onOpenChange={setMobileTreeOpen}>
        <SheetContent
          side="left"
          className="flex w-[88vw] flex-col gap-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle>{t('tree.heading')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('tree.heading')}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <DraftTree
              isCourse={isCourse}
              query={draftQuery}
              modules={treeModules}
              selectedLessonId={selectedLessonId}
              onSelectLesson={(_moduleId, lessonId) => {
                setUserSelectedLessonId(lessonId);
                setActiveSection('content');
                setMobileTreeOpen(false);
              }}
              onAddModule={handleAddModule}
              onRenameModule={handleRenameModule}
              onDeleteModule={handleDeleteModule}
              onReorderModules={handleReorderModules}
              onAddLesson={handleAddLesson}
              onRenameLesson={handleRenameLesson}
              onDeleteLesson={handleDeleteLesson}
              onReorderLessons={handleReorderLessons}
              onMoveLesson={handleMoveLesson}
              pendingRenameId={pendingRenameId}
              onPendingRenameResolved={() => setPendingRenameId(null)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sidebar tree wrapper — handles loading / error / empty / not-a-course      */
/* -------------------------------------------------------------------------- */

type DraftQuery = ReturnType<typeof useCourseDraft>;

type DraftTreeProps = {
  isCourse: boolean;
  query: DraftQuery;
  modules: ContentTreeModule[];
  selectedLessonId: string | null;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onAddModule: () => void;
  onRenameModule: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
  onReorderModules: (orderedIds: string[]) => void;
  onAddLesson: (moduleId: string) => void;
  onRenameLesson: (lessonId: string, title: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons: (moduleId: string, orderedIds: string[]) => void;
  onMoveLesson: (lessonId: string, targetModuleId: string) => void;
  pendingRenameId: string | null;
  onPendingRenameResolved: () => void;
};

function DraftTree({
  isCourse,
  query,
  modules,
  selectedLessonId,
  onSelectLesson,
  onAddModule,
  onRenameModule,
  onDeleteModule,
  onReorderModules,
  onAddLesson,
  onRenameLesson,
  onDeleteLesson,
  onReorderLessons,
  onMoveLesson,
  pendingRenameId,
  onPendingRenameResolved,
}: DraftTreeProps) {
  const t = useTranslations('teach-products.editor.load');

  if (!isCourse) {
    return (
      <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
        {t('notACourseDescription')}
      </p>
    );
  }

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-1.5 py-1.5" aria-label={t('loading')}>
        <Skeleton className="h-7 w-full" />
        <Skeleton className="ml-3 h-6 w-[88%]" />
        <Skeleton className="ml-3 h-6 w-[80%]" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="ml-3 h-6 w-[76%]" />
      </div>
    );
  }

  if (query.isError) {
    const reason =
      query.error instanceof CourseDraftError ? query.error.reason : 'unknown';
    return (
      <DraftLoadError
        reason={reason}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
      />
    );
  }

  return (
    <ContentTree
      modules={modules}
      selectedLessonId={selectedLessonId}
      onSelectLesson={onSelectLesson}
      onAddModule={onAddModule}
      onRenameModule={onRenameModule}
      onDeleteModule={onDeleteModule}
      onReorderModules={onReorderModules}
      onAddLesson={onAddLesson}
      onRenameLesson={onRenameLesson}
      onDeleteLesson={onDeleteLesson}
      onReorderLessons={onReorderLessons}
      onMoveLesson={onMoveLesson}
      pendingRenameId={pendingRenameId}
      onPendingRenameResolved={onPendingRenameResolved}
    />
  );
}

function DraftLoadError({
  reason,
  onRetry,
  isRetrying,
}: {
  reason: 'forbidden' | 'not-found' | 'not-a-course' | 'unauthorized' | 'network' | 'unknown';
  onRetry: () => void;
  isRetrying: boolean;
}) {
  const t = useTranslations('teach-products.editor.load');
  const titleKey =
    reason === 'forbidden'
      ? 'forbiddenTitle'
      : reason === 'not-a-course'
        ? 'notACourseTitle'
        : 'errorTitle';
  const descriptionKey =
    reason === 'forbidden'
      ? 'forbiddenDescription'
      : reason === 'not-a-course'
        ? 'notACourseDescription'
        : 'errorDescription';
  const showRetry = reason !== 'forbidden' && reason !== 'not-a-course';
  return (
    <div role="alert" className="flex flex-col gap-2 px-2.5 py-2">
      <p className="text-xs font-semibold text-foreground">{t(titleKey)}</p>
      <p className="text-xs leading-snug text-muted-foreground">
        {t(descriptionKey)}
      </p>
      {showRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="h-7 w-fit gap-1.5 px-2.5 text-xs"
        >
          <RotateCwIcon className={cn('size-3', isRetrying && 'animate-spin')} />
          {t('retry')}
        </Button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main content area                                                          */
/* -------------------------------------------------------------------------- */

type ContentSectionProps = {
  reduceMotion: boolean;
  isCourse: boolean;
  query: DraftQuery;
  selectedLesson: { module: DraftModule; lesson: DraftLesson } | null;
  onUpdateHtml: (blockId: string, html: string) => void;
  onUpdateKatex: (blockId: string, source: string) => void;
  onAddBlock: (type: CreatableBlockType) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorderBlocks: (orderedIds: string[]) => void;
};

function ContentSection({
  reduceMotion,
  isCourse,
  query,
  selectedLesson,
  onUpdateHtml,
  onUpdateKatex,
  onAddBlock,
  onRemoveBlock,
  onReorderBlocks,
}: ContentSectionProps) {
  const t = useTranslations('teach-products.editor');
  const tLoad = useTranslations('teach-products.editor.load');

  if (!isCourse) {
    return (
      <motion.div
        key="not-a-course"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
      >
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {tLoad('notACourseTitle')}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {tLoad('notACourseDescription')}
        </p>
      </motion.div>
    );
  }

  if (query.isPending) {
    return (
      <motion.div
        key="loading"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-6"
        aria-label={tLoad('loading')}
      >
        <div className="flex flex-col gap-2 px-1">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-7 w-2/3" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[78%]" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </motion.div>
    );
  }

  if (query.isError) {
    const reason =
      query.error instanceof CourseDraftError ? query.error.reason : 'unknown';
    return (
      <motion.div
        key={`error-${reason}`}
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        role="alert"
        className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center"
      >
        <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {tLoad(reason === 'forbidden' ? 'forbiddenTitle' : 'errorTitle')}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {tLoad(
            reason === 'forbidden' ? 'forbiddenDescription' : 'errorDescription',
          )}
        </p>
        {reason !== 'forbidden' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="mt-4 gap-1.5"
          >
            <RotateCwIcon
              className={cn('size-3', query.isFetching && 'animate-spin')}
            />
            {tLoad('retry')}
          </Button>
        ) : null}
      </motion.div>
    );
  }

  if (!selectedLesson) {
    return (
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
    );
  }

  return (
    <motion.div
      key={`lesson-${selectedLesson.lesson.id}`}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-6"
    >
      {/* Lesson header — hidden on mobile/tablet, where the same context is
          shown in the tree-trigger row above the section content. */}
      <div className="hidden flex-col gap-1 px-1 lg:flex">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {selectedLesson.module.title}
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {selectedLesson.lesson.title}
        </h2>
      </div>
      <LessonBlocks
        blocks={selectedLesson.lesson.blocks satisfies LessonBlock[]}
        onUpdateHtml={onUpdateHtml}
        onUpdateKatex={onUpdateKatex}
        onAddBlock={onAddBlock}
        onRemoveBlock={onRemoveBlock}
        onReorder={onReorderBlocks}
      />
    </motion.div>
  );
}

/**
 * "Содержание" sidebar entry that hosts the lesson tree. The tree expands
 * only while the section is active — selecting the section opens it,
 * picking another section collapses it back into a single-line nav row.
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
  return (
    <li>
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
        {active ? (
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
            <div className="max-h-[min(60vh,520px)] overflow-x-hidden overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline title editor                                                        */
/* -------------------------------------------------------------------------- */

function TitleEditor({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onCommit(value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => onCommit(value)}
      onKeyDown={onKeyDown}
      className="h-10 w-full max-w-xl text-2xl font-semibold tracking-tight md:text-3xl lg:text-[28px]"
      aria-label={initial}
    />
  );
}
