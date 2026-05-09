'use client';

import { useDraggable } from '@dnd-kit/core';
import { ClockIcon, GraduationCapIcon, RadioIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

import type { DemoProduct } from '../model/types';

import { Cover } from './cover';

type ProductCardProps = {
  product: DemoProduct;
  selected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  draggable?: boolean;
  layoutId?: string;
  compact?: boolean;
};

export function ProductCard({
  product,
  selected,
  onClick,
  draggable = true,
  layoutId,
  compact,
}: ProductCardProps) {
  const t = useTranslations('folders-demo');
  const reduceMotion = useReducedMotion();

  const { setNodeRef, listeners, attributes, isDragging, transform } =
    useDraggable({
      id: `product:${product.id}`,
      data: { kind: 'product', id: product.id, folderId: product.folderId },
      disabled: !draggable,
    });

  const isCourse = product.type === 'course';

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onClick}
      layoutId={layoutId}
      whileHover={reduceMotion || isDragging ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      role="button"
      tabIndex={0}
      aria-label={product.title}
      style={
        transform
          ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            }
          : undefined
      }
      className={cn(
        'group/product flex flex-col overflow-hidden rounded-2xl bg-card text-card-foreground',
        'ring-1 ring-foreground/10 transition-shadow',
        'hover:ring-foreground/20 hover:shadow-lg dark:hover:shadow-black/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected && 'ring-2 ring-brand',
        isDragging && 'opacity-40',
        compact ? 'h-full' : '',
      )}
    >
      <Cover
        cover={product.cover}
        className={compact ? 'h-20' : 'h-28'}
        emojiClassName={compact ? 'text-3xl' : 'text-4xl'}
      />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="h-5 px-1.5 text-[10px] uppercase tracking-wide"
          >
            {isCourse ? (
              <GraduationCapIcon className="size-3" />
            ) : (
              <RadioIcon className="size-3" />
            )}
            {isCourse ? t('type.course') : t('type.webinar')}
          </Badge>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ClockIcon className="size-3" />
            {t('stats.hours', { count: product.durationHours })}
          </span>
        </div>
        <h3
          className={cn(
            'font-semibold leading-snug tracking-tight text-foreground',
            compact ? 'text-sm line-clamp-2' : 'text-[15px] line-clamp-2',
          )}
        >
          {product.title}
        </h3>
      </div>
    </motion.div>
  );
}
