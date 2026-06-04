'use client';

import { useDraggable } from '@dnd-kit/core';
import {
  ArchiveIcon,
  ClockIcon,
  EllipsisIcon,
  FolderInputIcon,
  GraduationCapIcon,
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

import type { DemoProduct } from '../model/types';

import { Emoji } from './emoji';

type ProductCardProps = {
  product: DemoProduct;
  draggable?: boolean;
  isDraggingActive?: boolean;
  onMoveTo?: () => void;
  onClick?: () => void;
};

export function ProductCard({
  product,
  draggable = true,
  isDraggingActive,
  onMoveTo,
  onClick,
}: ProductCardProps) {
  const t = useTranslations('folders-demo');
  const tStatus = useTranslations('folders-demo.status');
  const reduceMotion = useReducedMotion();
  const format = useFormatter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { setNodeRef, listeners, attributes, isDragging, transform } =
    useDraggable({
      id: `product:${product.id}`,
      data: { kind: 'product', id: product.id, folderId: product.folderId },
      disabled: !draggable,
    });

  const isArchived = product.status === 'archived';
  const updated = format.relativeTime(new Date(product.updatedAt), {
    now: new Date('2026-05-10T10:00:00Z'),
  });

  const handleClick = (event: React.MouseEvent) => {
    if (isDragging) return;
    event.stopPropagation();
    onClick?.();
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
          aria-label={product.title}
          onClick={handleClick}
          whileHover={
            reduceMotion || isDragging || isDraggingActive
              ? undefined
              : { x: 2 }
          }
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={
            transform
              ? {
                  transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
                }
              : undefined
          }
          className={cn(
            'group/product relative flex h-full min-h-40 overflow-hidden rounded-3xl bg-card text-card-foreground ring-1 ring-foreground/[0.06]',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(15,23,42,0.04),0_4px_16px_-8px_rgba(15,23,42,0.08)]',
            'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_2px_rgba(0,0,0,0.3),0_4px_16px_-8px_rgba(0,0,0,0.4)]',
            'transition-shadow duration-300',
            'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(15,23,42,0.06),0_20px_44px_-12px_rgba(15,23,42,0.16)]',
            'dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.4),0_20px_44px_-12px_rgba(0,0,0,0.6)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            isDragging && 'opacity-40',
          )}
        >
          <div
            className={cn(
              'relative size-40 shrink-0 overflow-hidden ring-1 ring-inset ring-black/[0.08] transition-[filter] duration-500',
              isArchived && 'saturate-[0.4]',
            )}
          >
            <div
              className={cn(
                'absolute inset-0 transition-transform duration-700 ease-out',
                !isDraggingActive && !reduceMotion && 'group-hover/product:scale-[1.06]',
              )}
              style={{
                background: `linear-gradient(135deg, ${product.cover.from} 0%, ${product.cover.to} 100%)`,
              }}
              aria-hidden
            >
              <div
                className="absolute inset-0 opacity-35 mix-blend-soft-light"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 22% 16%, rgba(255,255,255,0.9) 0%, transparent 35%)',
                }}
              />
              <div
                className="absolute inset-0 opacity-25 mix-blend-soft-light"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 78% 78%, rgba(255,255,255,0.6) 0%, transparent 45%)',
                }}
              />
              <div
                className="absolute inset-0 opacity-30 mix-blend-overlay"
                style={{
                  backgroundImage:
                    'linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.25) 50%, transparent 62%)',
                }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)',
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <Emoji
                  char={product.cover.emoji}
                  className={cn(
                    'relative size-16 -rotate-3 drop-shadow-[0_6px_14px_rgba(0,0,0,0.3)] transition-transform duration-700 ease-out',
                    !isDraggingActive && !reduceMotion && 'group-hover/product:rotate-0 group-hover/product:scale-105',
                  )}
                />
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white ring-1 ring-white/20 backdrop-blur-md">
              <GraduationCapIcon className="size-2.5" />
              {t('type.note')}
            </span>

            <StatusGlassChip
              status={product.status}
              label={tStatus(product.status)}
            />

            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-black/15 to-transparent"
            />
          </div>

          <div className="relative flex min-w-0 flex-1 flex-col gap-2.5 px-5 py-4">
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
                !isDraggingActive && 'group-hover/product:opacity-100',
              )}
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(108,92,231,0.06) 0%, transparent 60%)',
              }}
            />

            <div className="relative flex items-start gap-2">
              <h3
                className={cn(
                  'font-heading flex-1 pr-1 text-[17px] font-semibold leading-[1.25] tracking-tight line-clamp-2',
                  isArchived ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {product.title}
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
                          '-mt-1.5 -mr-2 opacity-0 transition-opacity group-hover/product:opacity-100 focus-visible:opacity-100',
                          dropdownOpen && 'opacity-100',
                        )}
                      />
                    }
                  >
                    <EllipsisIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <PencilIcon /> {t('actions.edit')}
                    </DropdownMenuItem>
                    {onMoveTo ? (
                      <DropdownMenuItem onClick={onMoveTo}>
                        <FolderInputIcon /> {t('actions.moveTo')}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <ArchiveIcon /> {t('actions.archive')}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">
                      <Trash2Icon /> {t('actions.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <p className="relative text-sm leading-6 text-muted-foreground line-clamp-2">
              {product.description}
            </p>

            <div className="relative mt-auto flex items-center text-xs text-muted-foreground">
              <div className="flex items-center divide-x divide-foreground/10">
                {product.durationHours > 0 ? (
                  <Stat
                    icon={<ClockIcon />}
                    label={t('stats.hours', { count: product.durationHours })}
                    first
                  />
                ) : null}
                {product.lessons ? (
                  <Stat
                    icon={<LayersIcon />}
                    label={t('stats.lessons', { count: product.lessons })}
                  />
                ) : null}
              </div>
              <span className="ml-auto truncate text-[11px] tracking-wide text-muted-foreground/70">
                {t('updated', { time: updated })}
              </span>
            </div>
          </div>
        </motion.article>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>
          <PencilIcon /> {t('actions.edit')}
        </ContextMenuItem>
        {onMoveTo ? (
          <ContextMenuItem onClick={onMoveTo}>
            <FolderInputIcon /> {t('actions.moveTo')}
          </ContextMenuItem>
        ) : null}
        <ContextMenuSeparator />
        <ContextMenuItem>
          <ArchiveIcon /> {t('actions.archive')}
        </ContextMenuItem>
        <ContextMenuItem variant="destructive">
          <Trash2Icon /> {t('actions.delete')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function StatusGlassChip({
  status,
  label,
}: {
  status: DemoProduct['status'];
  label: string;
}) {
  const styles: Record<DemoProduct['status'], { ring: string; dot: string }> = {
    published: {
      ring: 'ring-emerald-300/50',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
    },
    draft: {
      ring: 'ring-amber-300/50',
      dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
    },
    archived: { ring: 'ring-white/20', dot: 'bg-zinc-200' },
  };
  const s = styles[status];
  return (
    <span
      className={cn(
        'absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white ring-1 backdrop-blur-md',
        s.ring,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {label}
    </span>
  );
}

function Stat({
  icon,
  label,
  first,
}: {
  icon: React.ReactNode;
  label: string;
  first?: boolean;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 tabular-nums',
        first ? 'pr-3' : 'px-3',
      )}
    >
      <span className="text-muted-foreground/60 [&>svg]:size-3">{icon}</span>
      <span className="text-foreground/85">{label}</span>
    </span>
  );
}
