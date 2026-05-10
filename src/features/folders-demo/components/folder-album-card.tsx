'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  EllipsisIcon,
  FolderIcon,
  FolderInputIcon,
  FolderOpenIcon,
  LayersIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import { descendantIds, productsInFolder } from '../lib/folder-tree';
import type { DemoFolder, DemoProduct, DemoState } from '../model/types';

import { Emoji } from './emoji';

type FolderAlbumCardProps = {
  folder: DemoFolder;
  state: DemoState;
  onOpen: () => void;
  onRename?: () => void;
  onMoveTo?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  isDraggingActive?: boolean;
};

export function FolderAlbumCard({
  folder,
  state,
  onOpen,
  onRename,
  onMoveTo,
  onDelete,
  draggable = true,
  isDraggingActive,
}: FolderAlbumCardProps) {
  const t = useTranslations('folders-demo');
  const reduceMotion = useReducedMotion();
  const format = useFormatter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { isOver, setNodeRef: setDropRef } = useDroppable({
    id: `folder-drop:${folder.id}`,
    data: { kind: 'folder', id: folder.id },
  });

  const {
    setNodeRef: setDragRef,
    listeners,
    attributes,
    isDragging,
    transform,
  } = useDraggable({
    id: `folder-drag:${folder.id}`,
    data: { kind: 'folder', id: folder.id },
    disabled: !draggable,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDropRef(node);
    setDragRef(node);
  };

  const ids = descendantIds(state, folder.id);
  ids.delete(folder.id);
  const subfolderCount = ids.size;

  const allInside = state.products.filter(
    (p) =>
      p.folderId !== null &&
      (p.folderId === folder.id || ids.has(p.folderId)),
  );
  const productCount = allInside.length;
  const previews = allInside.slice(0, 4);

  const updated = format.relativeTime(new Date(folder.updatedAt), {
    now: new Date('2026-05-10T10:00:00Z'),
  });

  const handleClick = (event: React.MouseEvent) => {
    if (isDragging) return;
    event.stopPropagation();
    onOpen();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <motion.article
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={0}
          aria-label={t('folder.openLabel', { name: folder.name })}
          onClick={handleClick}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onOpen();
            }
          }}
          whileHover={
            reduceMotion || isDragging || isDraggingActive
              ? undefined
              : { x: 2 }
          }
          animate={isOver ? { scale: 1.015 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={
            transform
              ? {
                  transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
                }
              : undefined
          }
          className={cn(
            'group/folder relative flex h-full min-h-40 overflow-hidden rounded-3xl bg-card text-card-foreground ring-1 ring-foreground/[0.06]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-8px_rgba(15,23,42,0.08)]',
            'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_-8px_rgba(0,0,0,0.4)]',
            'transition-shadow duration-300',
            'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(15,23,42,0.06),0_20px_44px_-12px_rgba(15,23,42,0.16)]',
            'dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.4),0_20px_44px_-12px_rgba(0,0,0,0.6)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isOver &&
              'ring-2 ring-brand shadow-[0_0_0_8px_rgba(108,92,231,0.12),0_24px_48px_-16px_rgba(108,92,231,0.4)]',
            isDragging && 'opacity-40',
          )}
        >
          <FolderArt
            previews={previews}
            isOver={isOver}
            isDraggingActive={isDraggingActive}
            reduceMotion={!!reduceMotion}
            emoji={folder.emoji ?? '📁'}
            count={productCount}
          />

          <div className="relative flex min-w-0 flex-1 flex-col gap-2.5 px-5 py-4">
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
                !isDraggingActive && 'group-hover/folder:opacity-100',
              )}
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(108,92,231,0.06) 0%, transparent 60%)',
              }}
            />

            <div className="relative flex items-start gap-2">
              <h3 className="font-heading flex-1 pr-1 text-[17px] font-semibold leading-[1.25] tracking-tight text-foreground line-clamp-1">
                {folder.name}
              </h3>
              <div onClick={(event) => event.stopPropagation()}>
                <DropdownMenu onOpenChange={setDropdownOpen}>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={t('actions.more')}
                        className={cn(
                          '-mt-1.5 -mr-2 opacity-0 transition-opacity group-hover/folder:opacity-100 focus-visible:opacity-100',
                          dropdownOpen && 'opacity-100',
                        )}
                      />
                    }
                  >
                    <EllipsisIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onOpen}>
                      <FolderOpenIcon /> {t('actions.open')}
                    </DropdownMenuItem>
                    {onRename ? (
                      <DropdownMenuItem onClick={onRename}>
                        <PencilIcon /> {t('actions.rename')}
                      </DropdownMenuItem>
                    ) : null}
                    {onMoveTo ? (
                      <DropdownMenuItem onClick={onMoveTo}>
                        <FolderInputIcon /> {t('actions.moveTo')}
                      </DropdownMenuItem>
                    ) : null}
                    {onDelete ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={onDelete}
                        >
                          <Trash2Icon /> {t('actions.delete')}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {folder.description ? (
              <p className="relative text-sm leading-6 text-muted-foreground line-clamp-2">
                {folder.description}
              </p>
            ) : null}

            <div className="relative mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground/85 tabular-nums">
                <LayersIcon className="size-3 text-muted-foreground/60" />
                {productCount > 0
                  ? t('folder.productCount', { count: productCount })
                  : t('folder.empty')}
              </span>
              {subfolderCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 border-l border-foreground/10 pl-2.5 tabular-nums">
                  <FolderIcon className="size-3 text-muted-foreground/60" />
                  {t('folder.subfolderCount', { count: subfolderCount })}
                </span>
              ) : null}
              <span className="ml-auto truncate text-[11px] tracking-wide text-muted-foreground/70">
                {t('updated', { time: updated })}
              </span>
            </div>
          </div>
        </motion.article>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onOpen}>
          <FolderOpenIcon /> {t('actions.open')}
        </ContextMenuItem>
        {onRename ? (
          <ContextMenuItem onClick={onRename}>
            <PencilIcon /> {t('actions.rename')}
          </ContextMenuItem>
        ) : null}
        {onMoveTo ? (
          <ContextMenuItem onClick={onMoveTo}>
            <FolderInputIcon /> {t('actions.moveTo')}
          </ContextMenuItem>
        ) : null}
        {onDelete ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon /> {t('actions.delete')}
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function FolderArt({
  previews,
  isOver,
  isDraggingActive,
  reduceMotion,
  emoji,
  count,
}: {
  previews: DemoProduct[];
  isOver: boolean;
  isDraggingActive?: boolean;
  reduceMotion: boolean;
  emoji: string;
  count: number;
}) {
  if (previews.length === 0) {
    return (
      <div
        aria-hidden
        className={cn(
          'relative flex size-40 shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ring-black/[0.08] transition-colors duration-300',
          'bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50',
          'dark:from-amber-950/50 dark:via-orange-950/30 dark:to-rose-950/30',
          isOver && 'from-brand/30 via-brand/15 to-brand/5',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.10) 100%)',
          }}
        />
        <Emoji
          char={emoji}
          className={cn(
            'relative size-16 -rotate-3 drop-shadow-[0_4px_10px_rgba(180,83,9,0.18)] transition-transform duration-700 ease-out',
            !isDraggingActive && !reduceMotion && 'group-hover/folder:rotate-0 group-hover/folder:scale-105',
          )}
        />
        <FolderBadge count={0} />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-black/10 to-transparent"
        />
      </div>
    );
  }

  const cells: (DemoProduct | null)[] = [
    previews[0] ?? null,
    previews[1] ?? null,
    previews[2] ?? null,
    previews[3] ?? null,
  ];

  return (
    <div
      aria-hidden
      className="relative size-40 shrink-0 overflow-hidden ring-1 ring-inset ring-black/[0.08]"
    >
      <div
        className={cn(
          'relative grid h-full w-full grid-cols-2 grid-rows-2 transition-transform duration-700 ease-out',
          !isDraggingActive && !reduceMotion && 'group-hover/folder:scale-[1.06]',
        )}
      >
        {cells.map((product, index) => (
          <MosaicCell key={index} product={product} index={index} />
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)',
        }}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/5 to-transparent transition-opacity duration-300',
          isOver && 'opacity-0',
        )}
      />
      {isOver ? (
        <div className="pointer-events-none absolute inset-0 bg-brand/25 mix-blend-overlay" />
      ) : null}
      <FolderBadge count={count} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-black/15 to-transparent"
      />
    </div>
  );
}

function FolderBadge({ count }: { count: number }) {
  return (
    <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md">
      <FolderIcon className="size-2.5" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}

function MosaicCell({
  product,
  index,
}: {
  product: DemoProduct | null;
  index: number;
}) {
  if (!product) {
    return <div className="bg-muted" />;
  }
  const isRightColumn = index % 2 === 1;
  const isBottomRow = index >= 2;
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${product.cover.from} 0%, ${product.cover.to} 100%)`,
      }}
    >
      <span
        className="absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(circle at 25% 18%, white 0%, transparent 55%)',
        }}
      />
      <Emoji char={product.cover.emoji} className="relative size-7 -rotate-3" />
      {!isRightColumn ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/15"
        />
      ) : null}
      {!isBottomRow ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/15"
        />
      ) : null}
    </div>
  );
}
