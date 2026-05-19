'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CommandIcon,
  FolderPlusIcon,
  GraduationCapIcon,
  HomeIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useIsClient } from '../hooks/use-is-client';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import { TextInput } from '@/shared/ui/input-extended';
import { Kbd } from '@/shared/ui/kbd';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

import { useDemoState } from '../hooks/use-demo-state';
import {
  findFolder,
  foldersInFolder,
  pathToFolder,
  productsInFolder,
} from '../lib/folder-tree';
import type {
  DemoFolder,
  DemoProduct,
  DemoProductType,
} from '../model/types';

import { CommandPalette } from './command-palette';
import { CreateFolderDialog } from './create-folder-dialog';
import { Emoji } from './emoji';
import { FolderAlbumCard } from './folder-album-card';
import { MoveToDialog } from './move-to-dialog';
import { ProductCard } from './product-card';

type Filter = 'all' | DemoProductType;

type DragKind =
  | { kind: 'product'; product: DemoProduct }
  | { kind: 'folder'; folder: DemoFolder };

type MoveTarget =
  | { kind: 'product'; id: string }
  | { kind: 'folder'; id: string };

export function LibraryView() {
  const t = useTranslations('folders-demo');
  const reduceMotion = useReducedMotion();
  const {
    state,
    moveProductTo,
    moveFolderTo,
    create,
    rename,
    removeFolder,
    reset,
  } = useDemoState();

  const [folderId, setFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [activeDrag, setActiveDrag] = useState<DragKind | null>(null);
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [createParentId, setCreateParentId] = useState<string | null | undefined>(
    undefined,
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const mounted = useIsClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor),
  );

  const path = useMemo(() => pathToFolder(state, folderId), [state, folderId]);
  const currentFolder = folderId ? findFolder(state, folderId) : null;

  const folders = useMemo(() => {
    const list = foldersInFolder(state, folderId);
    const q = search.trim().toLocaleLowerCase();
    if (!q) return list;
    return list.filter((f) =>
      f.name.toLocaleLowerCase().includes(q) ||
      f.description.toLocaleLowerCase().includes(q),
    );
  }, [state, folderId, search]);

  const products = useMemo(() => {
    const list = productsInFolder(state, folderId);
    const q = search.trim().toLocaleLowerCase();
    return list.filter((p) => {
      if (filter !== 'all' && p.type !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLocaleLowerCase().includes(q) ||
        p.description.toLocaleLowerCase().includes(q)
      );
    });
  }, [state, folderId, filter, search]);

  const counts = useMemo(() => {
    const direct = productsInFolder(state, folderId);
    return direct.reduce(
      (acc, p) => {
        acc.all += 1;
        acc[p.type] += 1;
        return acc;
      },
      { all: 0, course: 0 } as Record<Filter, number>,
    );
  }, [state, folderId]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as
        | { kind: 'product'; id: string }
        | { kind: 'folder'; id: string }
        | undefined;
      if (!data) return;
      if (data.kind === 'product') {
        const product = state.products.find((p) => p.id === data.id);
        if (product) setActiveDrag({ kind: 'product', product });
      } else {
        const folder = state.folders.find((f) => f.id === data.id);
        if (folder) setActiveDrag({ kind: 'folder', folder });
      }
    },
    [state],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over) return;
      const sourceData = active.data.current as
        | { kind: 'product'; id: string }
        | { kind: 'folder'; id: string }
        | undefined;
      const targetData = over.data.current as
        | { kind: 'folder'; id: string | null }
        | { kind: 'breadcrumb'; id: string | null }
        | undefined;
      if (!sourceData || !targetData) return;
      const targetId =
        targetData.kind === 'folder' || targetData.kind === 'breadcrumb'
          ? targetData.id
          : null;

      if (sourceData.kind === 'product') {
        moveProductTo(sourceData.id, targetId);
      } else if (sourceData.kind === 'folder') {
        moveFolderTo(sourceData.id, targetId);
      }
    },
    [moveProductTo, moveFolderTo],
  );

  // Surface-level shortcuts: Esc up one level, Cmd/Ctrl+K palette, Cmd/Ctrl+N new folder.
  // Single small useEffect for a demo with three bindings — not worth pulling in
  // react-hotkeys-hook just for this; keep behavior tight and local.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isFormField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      const meta = event.metaKey || event.ctrlKey;

      if (meta && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      if (meta && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setCreateParentId((prev) => (prev === undefined ? folderId : prev));
        return;
      }

      if (event.key === 'Escape' && !isFormField && folderId !== null) {
        const parent = currentFolder?.parentId ?? null;
        setFolderId(parent);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [folderId, currentFolder]);

  const handleMoveSubmit = (targetFolderId: string | null) => {
    if (!moveTarget) return;
    if (moveTarget.kind === 'product') {
      moveProductTo(moveTarget.id, targetFolderId);
    } else {
      moveFolderTo(moveTarget.id, targetFolderId);
    }
    setMoveTarget(null);
  };

  const handleCreateSubmit = (input: {
    name: string;
    description: string;
    emoji: string;
  }) => {
    if (createParentId === undefined) return;
    create(createParentId, input);
    setCreateParentId(undefined);
  };

  const tFilter = useTranslations('folders-demo.filter');

  const isFiltered = search.trim().length > 0 || filter !== 'all';
  const showEmpty =
    mounted && folders.length === 0 && products.length === 0 && !isFiltered;
  const showFilterEmpty =
    mounted && folders.length === 0 && products.length === 0 && isFiltered;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-3 md:px-8">
            <Link
              href="/"
              className="inline-flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeftIcon className="size-4" />
              {t('back')}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
              {currentFolder ? currentFolder.name : t('title')}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {currentFolder ? currentFolder.description : t('description')}
            </p>
          </div>

          <BreadcrumbRow path={path} onNavigate={setFolderId} />

          <div className="mt-4 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center md:justify-between">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as Filter)}
            >
              <TabsList className="h-9">
                <FilterTab value="all" label={tFilter('all')} count={counts.all} />
                <FilterTab
                  value="course"
                  label={tFilter('courses')}
                  count={counts.course}
                  icon={<GraduationCapIcon className="size-3.5" />}
                />
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className="h-9 gap-1.5 text-muted-foreground"
                onClick={() => setPaletteOpen(true)}
                aria-label={t('palette.openAriaLabel')}
              >
                <CommandIcon className="size-3.5" />
                <Kbd className="bg-transparent text-muted-foreground">⌘K</Kbd>
              </Button>
              <div className="relative w-full md:w-64">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <TextInput
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="h-9 pl-8"
                  aria-label={t('searchAriaLabel')}
                />
              </div>
              <Button
                variant="outline"
                size="lg"
                className="h-9 gap-1.5"
                onClick={() => setCreateParentId(folderId)}
              >
                <FolderPlusIcon /> {t('actions.newFolder')}
              </Button>
              <Button size="lg" className="h-9 gap-1.5">
                <PlusIcon /> {t('actions.newProduct')}
              </Button>
            </div>
          </div>

          <div className="mt-6 md:mt-8">
            {!mounted ? (
              <GridSkeleton />
            ) : (
              <ContextMenu>
                <ContextMenuTrigger>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={folderId ?? 'root'}
                      initial={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: -8 }
                      }
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    >
                      {showEmpty ? (
                        <EmptyFolder
                          onCreateFolder={() => setCreateParentId(folderId)}
                          isDragging={activeDrag !== null}
                          folderId={folderId}
                        />
                      ) : showFilterEmpty ? (
                        <NoMatches />
                      ) : (
                        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                          {folders.map((folder) => (
                            <li key={`folder-${folder.id}`}>
                              <FolderAlbumCard
                                folder={folder}
                                state={state}
                                isDraggingActive={activeDrag !== null}
                                onOpen={() => setFolderId(folder.id)}
                                onMoveTo={() =>
                                  setMoveTarget({ kind: 'folder', id: folder.id })
                                }
                                onRename={() => {
                                  const name = prompt(
                                    t('actions.renamePrompt'),
                                    folder.name,
                                  );
                                  if (name && name.trim().length > 0) {
                                    rename(folder.id, name.trim());
                                  }
                                }}
                                onDelete={() => removeFolder(folder.id)}
                              />
                            </li>
                          ))}
                          {products.map((product) => (
                            <li key={`product-${product.id}`}>
                              <ProductCard
                                product={product}
                                isDraggingActive={activeDrag !== null}
                                onMoveTo={() =>
                                  setMoveTarget({ kind: 'product', id: product.id })
                                }
                              />
                            </li>
                          ))}
                          {/* Tail spacer so right-click after last card hits the grid */}
                          <li
                            aria-hidden
                            className="hidden h-32 sm:block"
                          />
                        </ul>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-56">
                  <ContextMenuItem
                    onClick={() => setCreateParentId(folderId)}
                  >
                    <FolderPlusIcon /> {t('actions.newFolder')}
                    <span className="ml-auto inline-flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <Kbd>N</Kbd>
                    </span>
                  </ContextMenuItem>
                  <ContextMenuItem>
                    <PlusIcon /> {t('actions.newProduct')}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setPaletteOpen(true)}>
                    <CommandIcon /> {t('palette.openLabel')}
                    <span className="ml-auto inline-flex items-center gap-1">
                      <Kbd>⌘</Kbd>
                      <Kbd>K</Kbd>
                    </span>
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={reset}>
                    <RotateCcwIcon /> {t('palette.reset')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            )}
          </div>
        </main>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag ? <DragGhost drag={activeDrag} /> : null}
      </DragOverlay>

      <MoveToDialog
        open={moveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null);
        }}
        state={state}
        excludeFolderId={
          moveTarget?.kind === 'folder' ? moveTarget.id : undefined
        }
        currentFolderId={
          moveTarget?.kind === 'product'
            ? state.products.find((p) => p.id === moveTarget.id)?.folderId ?? null
            : moveTarget?.kind === 'folder'
              ? state.folders.find((f) => f.id === moveTarget.id)?.parentId ??
                null
              : null
        }
        onSelect={handleMoveSubmit}
      />

      <CreateFolderDialog
        open={createParentId !== undefined}
        onOpenChange={(open) => {
          if (!open) setCreateParentId(undefined);
        }}
        parentName={
          createParentId
            ? findFolder(state, createParentId)?.name ?? null
            : null
        }
        onCreate={handleCreateSubmit}
      />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        state={state}
        currentFolderId={folderId}
        onNavigate={setFolderId}
        onCreateFolder={() => setCreateParentId(folderId)}
        onReset={reset}
      />
    </DndContext>
  );
}

function BreadcrumbRow({
  path,
  onNavigate,
}: {
  path: ReturnType<typeof pathToFolder>;
  onNavigate: (id: string | null) => void;
}) {
  const t = useTranslations('folders-demo');
  return (
    <nav
      aria-label={t('breadcrumb.label')}
      className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
    >
      <BreadcrumbCrumb
        id={null}
        label={t('breadcrumb.allProducts')}
        icon={<HomeIcon className="size-3.5" />}
        active={path.length === 0}
        onClick={() => onNavigate(null)}
      />
      {path.map((segment, index) => (
        <span key={segment.id} className="contents">
          <ChevronRightIcon
            className="size-3 shrink-0 text-muted-foreground/60"
            aria-hidden
          />
          <BreadcrumbCrumb
            id={segment.id}
            label={segment.name}
            active={index === path.length - 1}
            onClick={() => onNavigate(segment.id)}
          />
        </span>
      ))}
    </nav>
  );
}

function BreadcrumbCrumb({
  id,
  label,
  icon,
  active,
  onClick,
}: {
  id: string | null;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `breadcrumb:${id ?? 'root'}`,
    data: { kind: 'breadcrumb', id },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors',
        active
          ? 'text-foreground font-medium'
          : 'hover:bg-muted hover:text-foreground',
        isOver && 'bg-brand/15 text-brand ring-2 ring-brand',
      )}
    >
      {icon}
      <span className="truncate max-w-[200px]">{label}</span>
    </button>
  );
}

function FilterTab({
  value,
  label,
  count,
  icon,
}: {
  value: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <TabsTrigger value={value} className="gap-1.5">
      {icon}
      {label}
      <span className="ml-1 inline-flex h-5 items-center justify-center rounded bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">
        {count}
      </span>
    </TabsTrigger>
  );
}

function EmptyFolder({
  onCreateFolder,
  isDragging,
  folderId,
}: {
  onCreateFolder: () => void;
  isDragging: boolean;
  folderId: string | null;
}) {
  const t = useTranslations('folders-demo');
  const { isOver, setNodeRef } = useDroppable({
    id: `empty-drop:${folderId ?? 'root'}`,
    data: { kind: 'folder', id: folderId },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-16 text-center transition-colors',
        isOver && isDragging && 'border-brand bg-brand/10',
      )}
    >
      <div className="text-5xl" aria-hidden>
        📁
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold text-foreground">
          {t('empty.title')}
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t('empty.description')}
        </p>
      </div>
      <Button variant="outline" onClick={onCreateFolder}>
        <FolderPlusIcon /> {t('actions.newFolder')}
      </Button>
    </div>
  );
}

function NoMatches() {
  const t = useTranslations('folders-demo');
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <SearchIcon className="size-8 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{t('empty.noMatches')}</p>
    </div>
  );
}

function GridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex h-40 overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/[0.06] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-8px_rgba(15,23,42,0.08)]"
        >
          <Skeleton className="size-40 shrink-0 rounded-none" />
          <div className="flex flex-1 flex-col gap-2 px-5 py-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="mt-auto flex items-center gap-3">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="ml-auto h-3 w-24" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DragGhost({ drag }: { drag: DragKind }) {
  const isProduct = drag.kind === 'product';
  const emojiChar = isProduct ? drag.product.cover.emoji : drag.folder.emoji ?? '📁';
  const title = isProduct ? drag.product.title : drag.folder.name;
  return (
    <div className="flex w-60 rotate-1 items-center gap-2.5 rounded-xl bg-card p-2.5 pr-3 shadow-xl ring-1 ring-foreground/10">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/70 ring-1 ring-foreground/[0.06]"
      >
        <Emoji char={emojiChar} className="size-6" />
      </span>
      <span className="text-sm font-semibold leading-snug line-clamp-2">
        {title}
      </span>
    </div>
  );
}
