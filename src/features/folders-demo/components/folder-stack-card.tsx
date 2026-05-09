'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FolderIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { cn } from '@/shared/lib/utils';

import { previewProducts } from '../lib/folder-tree';
import type { DemoFolder, DemoState } from '../model/types';

import { Cover } from './cover';

type FolderStackCardProps = {
  folder: DemoFolder;
  state: DemoState;
  onOpen: () => void;
  onHoverDuringDrag?: () => void;
  isDraggingSomething?: boolean;
  draggable?: boolean;
};

const HOVER_TO_OPEN_MS = 600;

export function FolderStackCard({
  folder,
  state,
  onOpen,
  onHoverDuringDrag,
  isDraggingSomething,
  draggable = true,
}: FolderStackCardProps) {
  const t = useTranslations('folders-demo');
  const reduceMotion = useReducedMotion();

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

  const previews = previewProducts(state, folder.id, 3);
  const totalCount =
    state.products.filter((p) => {
      // count direct + descendant
      const ids = new Set<string>([folder.id]);
      let added = true;
      while (added) {
        added = false;
        for (const f of state.folders) {
          if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
            ids.add(f.id);
            added = true;
          }
        }
      }
      return p.folderId !== null && ids.has(p.folderId);
    }).length;

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOver || !isDraggingSomething || !onHoverDuringDrag) return;
    hoverTimerRef.current = setTimeout(() => {
      onHoverDuringDrag();
    }, HOVER_TO_OPEN_MS);
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, [isOver, isDraggingSomething, onHoverDuringDrag]);

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      layoutId={`folder-${folder.id}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t('folder.openLabel', { name: folder.name })}
      whileHover={reduceMotion || isDragging ? undefined : { y: -3 }}
      animate={
        isOver && isDraggingSomething
          ? { scale: 1.04 }
          : { scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      style={
        transform
          ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            }
          : undefined
      }
      className={cn(
        'group/folder relative flex flex-col rounded-2xl bg-card text-card-foreground',
        'ring-1 ring-foreground/10 transition-shadow',
        'hover:ring-foreground/20 hover:shadow-lg dark:hover:shadow-black/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isOver && isDraggingSomething && 'ring-2 ring-brand shadow-lg',
        isDragging && 'opacity-40',
      )}
    >
      <div className="relative h-28 px-3 pt-3">
        <div className="relative h-full w-full">
          {previews.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/40">
              <FolderIcon className="size-8 text-muted-foreground/60" />
            </div>
          ) : (
            <>
              {previews[2] ? (
                <div
                  className="absolute inset-0 origin-bottom -translate-x-3 -rotate-6 transition-transform group-hover/folder:-translate-x-4 group-hover/folder:-rotate-8"
                  style={{ zIndex: 1 }}
                >
                  <Cover
                    cover={previews[2].cover}
                    className="h-full w-full opacity-70"
                    emojiClassName="text-2xl opacity-80"
                    rounded="all"
                  />
                </div>
              ) : null}
              {previews[1] ? (
                <div
                  className="absolute inset-0 origin-bottom translate-x-3 rotate-4 transition-transform group-hover/folder:translate-x-5 group-hover/folder:rotate-6"
                  style={{ zIndex: 2 }}
                >
                  <Cover
                    cover={previews[1].cover}
                    className="h-full w-full opacity-85"
                    emojiClassName="text-3xl opacity-90"
                    rounded="all"
                  />
                </div>
              ) : null}
              <div
                className="absolute inset-0 transition-transform group-hover/folder:-translate-y-1"
                style={{ zIndex: 3 }}
              >
                <Cover
                  cover={previews[0].cover}
                  className="h-full w-full ring-1 ring-foreground/10"
                  emojiClassName="text-4xl"
                  rounded="all"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 p-3 pt-3.5">
        <div className="flex items-center gap-2">
          {folder.emoji ? (
            <span className="text-base leading-none" aria-hidden>
              {folder.emoji}
            </span>
          ) : (
            <FolderIcon className="size-4 text-muted-foreground" />
          )}
          <h3 className="font-semibold leading-snug tracking-tight text-foreground line-clamp-1">
            {folder.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('folder.itemCount', { count: totalCount })}
        </p>
      </div>
    </motion.div>
  );
}
